/* Reads the shared (public) Apple Calendar named in the APPLE_CALENDAR_URL
   Netlify setting and returns its events as plain JSON, for the app to copy
   onto its own calendar (see syncAppleCalendar in src/App.jsx). One-way:
   Apple Calendar -> app. Needs the caller to be signed in, so the link can't
   be used to make this function fetch on demand for strangers.

   Handles single events, all-day and multi-day events, and the simple
   repeating rules (daily / weekly / monthly / yearly, with INTERVAL, COUNT,
   UNTIL, BYDAY for weekly, BYMONTHDAY for monthly), plus EXDATE skips and
   moved/edited occurrences (RECURRENCE-ID). Anything fancier (e.g. "second
   Tuesday of the month") shows only its first occurrence. Event times are
   used as written; times stored in UTC are converted to APPLE_CALENDAR_TZ
   (default Australia/Sydney).

   Values duplicated here rather than imported — Netlify's function bundler
   doesn't reliably resolve relative imports that reach outside
   netlify/functions/, and a broken function blocks the whole site deploy. */

const SUPABASE_URL = "https://hohokbhldedjyzbmywjp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaG9rYmhsZGVkanl6Ym15d2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTE0ODMsImV4cCI6MjEwMTM4NzQ4M30.Q_qVPVa1h9k5ZZxJL1eSg5KtvvjWYilVA-uOvdwDVOc";

const TZ = process.env.APPLE_CALENDAR_TZ || "Australia/Sydney";
const DAY = 86400000;
const PAST_DAYS = 30;
const FUTURE_DAYS = 400;
const MAX_OCCURRENCES = 1500;

/* ---------- civil-date helpers (no time zones, no DST surprises) ---------- */

const pad = (n) => String(n).padStart(2, "0");
const utcMs = (c) => Date.UTC(c.y, c.m - 1, c.d);
const fromMs = (ms) => {
  const dt = new Date(ms);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};
const addDays = (c, n) => fromMs(utcMs(c) + n * DAY);
const cmp = (a, b) => utcMs(a) - utcMs(b);
const keyOf = (c) => `${c.y}-${pad(c.m)}-${pad(c.d)}`;
const daysBetween = (a, b) => Math.round((utcMs(b) - utcMs(a)) / DAY);
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function todayInZone() {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/* ---------- iCalendar parsing ---------- */

// "20261009", "20261009T093000" (as written / TZID) or "20261009T093000Z" (UTC)
function parseIcsDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec((value || "").trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (m[4] === undefined) return { date: { y, m: mo, d }, time: "", allDay: true };
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  if (m[7] === "Z") {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(Date.UTC(y, mo - 1, d, hh, mm)));
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    return { date: { y: get("year"), m: get("month"), d: get("day") }, time: `${pad(get("hour"))}:${pad(get("minute"))}`, allDay: false };
  }
  return { date: { y, m: mo, d }, time: `${pad(hh)}:${pad(mm)}`, allDay: false };
}

const unescapeText = (s) => (s || "").replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();

function parseIcs(text) {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length) lines[lines.length - 1] += line.slice(1);
    else lines.push(line);
  }
  const events = [];
  let cur = null;
  let inAlarm = false;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = { EXDATE: [] };
      inAlarm = false;
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    // A reminder inside the event has its own DESCRIPTION — don't let it
    // overwrite the event's.
    if (line === "BEGIN:VALARM") {
      inAlarm = true;
      continue;
    }
    if (line === "END:VALARM") {
      inAlarm = false;
      continue;
    }
    if (inAlarm) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const name = line.slice(0, idx).split(";")[0].toUpperCase();
    const value = line.slice(idx + 1);
    if (name === "EXDATE") cur.EXDATE.push(...value.split(","));
    else cur[name] = value;
  }
  return events;
}

function parseRrule(value) {
  const out = {};
  for (const part of (value || "").split(";")) {
    const [k, v] = part.split("=");
    if (k) out[k.toUpperCase()] = v;
  }
  return out;
}

const WEEKDAY_OFFSET = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }; // Monday-first

// Start dates (not past `limit`) for a repeating event, or null when the rule
// is one this doesn't handle.
function expandStarts(base, rr, limit, keepFrom) {
  const freq = rr.FREQ;
  const interval = Math.max(1, Number(rr.INTERVAL) || 1);
  const count = rr.COUNT ? Number(rr.COUNT) : Infinity;
  let until = limit;
  if (rr.UNTIL) {
    const u = parseIcsDate(rr.UNTIL);
    if (u && cmp(u.date, limit) < 0) until = u.date;
  }
  // COUNT has to count every occurrence from the original start, but only
  // those from `keepFrom` on are kept — and only the kept ones count towards
  // the safety cap, so a daily event begun years ago still reaches today.
  const out = [];
  let total = 0;
  const emit = (c) => {
    total++;
    if (cmp(c, keepFrom) >= 0) emit(c);
  };
  const full = () => total >= count || out.length >= MAX_OCCURRENCES;

  if (freq === "DAILY") {
    for (let i = 0; !full(); i += interval) {
      const c = addDays(base, i);
      if (cmp(c, until) > 0) break;
      emit(c);
    }
    return out;
  }

  if (freq === "WEEKLY") {
    const days = (rr.BYDAY ? rr.BYDAY.split(",") : [])
      .map((d) => /^[+-]?\d*([A-Z]{2})$/.exec(d.trim()))
      .filter(Boolean)
      .map((m) => WEEKDAY_OFFSET[m[1]])
      .filter((n) => n !== undefined)
      .sort((a, b) => a - b);
    const baseDow = (new Date(utcMs(base)).getUTCDay() + 6) % 7; // Monday = 0
    const offsets = days.length ? days : [baseDow];
    const weekStart = addDays(base, -baseDow);
    for (let w = 0; ; w++) {
      const ws = addDays(weekStart, 7 * interval * w);
      if (cmp(ws, until) > 0) break;
      for (const off of offsets) {
        const c = addDays(ws, off);
        if (cmp(c, base) < 0) continue;
        if (cmp(c, until) > 0) return out;
        emit(c);
        if (full()) return out;
      }
    }
    return out;
  }

  if (freq === "MONTHLY") {
    if (rr.BYDAY) return null; // "second Tuesday" style — not handled
    const dom = (rr.BYMONTHDAY ? rr.BYMONTHDAY.split(",") : [String(base.d)]).map(Number).filter((n) => n && !Number.isNaN(n));
    for (let i = 0; ; i += interval) {
      const idx = base.m - 1 + i;
      const y = base.y + Math.floor(idx / 12);
      const m = (idx % 12) + 1;
      if (cmp({ y, m, d: 1 }, until) > 0) break;
      const dim = daysInMonth(y, m);
      const resolved = dom
        .map((n) => (n < 0 ? dim + n + 1 : n))
        .filter((n) => n >= 1 && n <= dim)
        .sort((a, b) => a - b);
      for (const d of resolved) {
        const c = { y, m, d };
        if (cmp(c, base) < 0) continue;
        if (cmp(c, until) > 0) return out;
        emit(c);
        if (full()) return out;
      }
      if (i > 12 * 60) break; // safety
    }
    return out;
  }

  if (freq === "YEARLY") {
    for (let i = 0; !full(); i += interval) {
      const y = base.y + i;
      if (base.m === 2 && base.d === 29 && daysInMonth(y, 2) < 29) continue;
      const c = { y, m: base.m, d: base.d };
      if (cmp(c, until) > 0) break;
      emit(c);
      if (i > 60) break; // safety
    }
    return out;
  }

  return null;
}

function buildEvents(icsText, winStart, winEnd) {
  const raw = parseIcs(icsText).filter((e) => (e.STATUS || "").toUpperCase() !== "CANCELLED" && e.DTSTART);

  // Moved/edited occurrences of a repeating event arrive as their own entry
  // naming the original date — the repeat must skip that date.
  const overridden = new Set();
  for (const e of raw) {
    if (!e["RECURRENCE-ID"]) continue;
    const r = parseIcsDate(e["RECURRENCE-ID"]);
    if (r && e.UID) overridden.add(`${e.UID}|${keyOf(r.date)}`);
  }

  const out = [];
  for (const e of raw) {
    const s = parseIcsDate(e.DTSTART);
    if (!s) continue;

    let spanDays = 0;
    if (e.DTEND) {
      const en = parseIcsDate(e.DTEND);
      if (en) {
        let endDate = en.date;
        // All-day end dates are exclusive; a timed event ending exactly at
        // midnight belongs to the day before.
        if (s.allDay || (en.time === "00:00" && cmp(en.date, s.date) > 0)) endDate = addDays(en.date, -1);
        spanDays = Math.max(0, daysBetween(s.date, endDate));
      }
    }

    const title = unescapeText(e.SUMMARY) || "Event";
    const where = unescapeText(e.LOCATION);
    const desc = unescapeText(e.DESCRIPTION);
    const notes = [where ? "At " + where : "", desc].filter(Boolean).join("\n");
    const uid = e.UID || `${title}|${keyOf(s.date)}`;

    const rr = e.RRULE ? parseRrule(e.RRULE) : null;
    let starts;
    if (rr && !e["RECURRENCE-ID"]) {
      starts = expandStarts(s.date, rr, winEnd, addDays(winStart, -spanDays)) || [s.date];
    } else {
      starts = [s.date];
    }
    const excluded = new Set(
      e.EXDATE.map((v) => parseIcsDate(v)).filter(Boolean).map((p) => keyOf(p.date))
    );

    for (const start of starts) {
      const end = addDays(start, spanDays);
      if (cmp(end, winStart) < 0 || cmp(start, winEnd) > 0) continue;
      const k = keyOf(start);
      if (rr && !e["RECURRENCE-ID"] && (excluded.has(k) || overridden.has(`${uid}|${k}`))) continue;
      out.push({
        // A one-off keeps its plain UID so moving it in Apple Calendar updates
        // the same entry in the app; each repeat needs its own.
        uid: rr || e["RECURRENCE-ID"] ? `${uid}#${k}` : uid,
        title,
        date: k,
        endDate: spanDays > 0 ? keyOf(end) : "",
        time: s.allDay ? "" : s.time,
        notes,
      });
    }
  }
  return out;
}

/* ---------- the endpoint ---------- */

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: "Not signed in" }) };
  }
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!userRes.ok) {
    return { statusCode: 401, body: JSON.stringify({ error: "Session expired — sign in again" }) };
  }

  const rawUrl = (process.env.APPLE_CALENDAR_URL || "").trim();
  if (!rawUrl) {
    return { statusCode: 501, body: JSON.stringify({ error: "Apple Calendar isn't set up (no APPLE_CALENDAR_URL)" }) };
  }
  const url = rawUrl.replace(/^webcal:\/\//i, "https://");

  let text;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "minto-app-calendar/1.0", Accept: "text/calendar" },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: `Apple Calendar answered ${res.status} — check the shared link` }) };
    }
    text = await res.text();
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "couldn't reach Apple Calendar" }) };
  }
  if (!text.includes("BEGIN:VCALENDAR")) {
    return { statusCode: 502, body: JSON.stringify({ error: "that link didn't return a calendar — check it's a public calendar link" }) };
  }

  const today = todayInZone();
  const winStart = addDays(today, -PAST_DAYS);
  const winEnd = addDays(today, FUTURE_DAYS);
  let events;
  try {
    events = buildEvents(text, winStart, winEnd);
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: "couldn't read the calendar" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events, windowStart: keyOf(winStart), windowEnd: keyOf(winEnd), count: events.length }),
  };
};
