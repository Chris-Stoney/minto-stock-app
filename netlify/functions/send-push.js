/* Generic push sender, shared by Chat and Calendar (and any future caller):
   given a channel/title/body, notifies everyone subscribed to that channel
   except the sender. "General" (or no property on the thing being notified
   about) notifies everyone; a property name only notifies people tagged to
   that property in push_subscriptions.property (set from their Team entry
   when they turn notifications on). Caller decides the title/body text —
   this function only handles who gets notified and the actual sending.

   Values duplicated here rather than imported — Netlify's function bundler
   doesn't reliably resolve relative imports that reach outside
   netlify/functions/, and a broken function blocks the whole site deploy
   (see the pasture-commentary function's history for why). */
import webpush from "web-push";
import http2 from "node:http2";
import crypto from "node:crypto";

// iPhone/iPad app devices are stored in push_subscriptions with endpoint
// "apns:<device token>" and are sent through Apple's push service (APNs)
// rather than web-push. Needs three Netlify env vars: APNS_KEY_ID,
// APNS_TEAM_ID and APNS_KEY_P8 (the .p8 file's contents, raw or base64).
const APNS_TOPIC = "au.com.mintopastoral.farmrecords";

// These logins are notified for every channel, not just General and their own
// property. Override without a code change by setting PUSH_ALL_CHANNELS in
// Netlify to a comma-separated list of emails.
const ALL_CHANNEL_WATCHERS = (process.env.PUSH_ALL_CHANNELS || "gwen@mintopastoral.com.au,info@mintopastoral.com.au")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const isApns = (s) => (s.endpoint || "").startsWith("apns:");

function apnsJwt(keyId, teamId, keyText) {
  const pem = keyText.includes("BEGIN PRIVATE KEY") ? keyText : Buffer.from(keyText, "base64").toString("utf8");
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = enc({ alg: "ES256", kid: keyId }) + "." + enc({ iss: teamId, iat: Math.floor(Date.now() / 1000) });
  const sig = crypto.sign("sha256", Buffer.from(unsigned), { key: pem, dsaEncoding: "ieee-p1363" });
  return unsigned + "." + sig.toString("base64url");
}

// One HTTP/2 connection, one request per device; resolves with a
// {ok, status, reason} per token, in order, and never rejects.
function sendApns(tokens, jwt, payload) {
  return new Promise((resolve) => {
    const out = new Array(tokens.length);
    if (!tokens.length) return resolve(out);
    let client;
    try {
      client = http2.connect("https://api.push.apple.com");
    } catch {
      return resolve(tokens.map(() => ({ ok: false, status: 0, reason: "connect" })));
    }
    client.on("error", () => {});
    let pending = tokens.length;
    const finish = (i, result) => {
      if (out[i]) return;
      out[i] = result;
      if (--pending === 0) {
        try {
          client.close();
        } catch {}
        resolve(out);
      }
    };
    const body = JSON.stringify(payload);
    tokens.forEach((token, i) => {
      try {
        const req = client.request({
          ":method": "POST",
          ":path": "/3/device/" + token,
          authorization: "bearer " + jwt,
          "apns-topic": APNS_TOPIC,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        });
        let status = 0;
        let data = "";
        req.on("response", (h) => {
          status = h[":status"];
        });
        req.on("data", (c) => {
          data += c;
        });
        req.on("close", () => finish(i, { ok: status === 200, status, reason: data }));
        req.on("error", () => finish(i, { ok: false, status: 0, reason: "error" }));
        req.setTimeout(8000, () => req.close());
        req.end(body);
      } catch {
        finish(i, { ok: false, status: 0, reason: "request" });
      }
    });
  });
}

const SUPABASE_URL = "https://hohokbhldedjyzbmywjp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaG9rYmhsZGVkanl6Ym15d2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTE0ODMsImV4cCI6MjEwMTM4NzQ4M30.Q_qVPVa1h9k5ZZxJL1eSg5KtvvjWYilVA-uOvdwDVOc";

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
  const senderEmail = (await userRes.json()).email;

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }
  const { channel, title, body: bodyText } = payload;
  if (!channel || !title) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing channel or title" }) };
  }

  const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!subsRes.ok) {
    return { statusCode: 500, body: JSON.stringify({ error: "Could not load subscriptions" }) };
  }
  const subs = await subsRes.json();
  const targets = subs.filter(
    (s) =>
      s.user_email !== senderEmail &&
      (channel === "General" || s.property === channel || ALL_CHANNEL_WATCHERS.includes((s.user_email || "").toLowerCase()))
  );
  const webTargets = targets.filter((s) => !isApns(s));
  const iosTargets = targets.filter(isApns);

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (webTargets.length && (!vapidPublic || !vapidPrivate)) {
    return { statusCode: 500, body: JSON.stringify({ error: "Push isn't configured (missing VAPID keys)" }) };
  }

  // Browsers / home-screen web apps
  let webResults = [];
  if (webTargets.length) {
    webpush.setVapidDetails("mailto:info@mintopastoral.com.au", vapidPublic, vapidPrivate);
    const notifPayload = JSON.stringify({ title, body: (bodyText || "").slice(0, 160), url: "/" });
    webResults = await Promise.allSettled(
      webTargets.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, notifPayload)
      )
    );
  }

  // The iPhone/iPad app. Skipped quietly if the APNs settings aren't in
  // Netlify yet, so web push keeps working either way.
  let iosResults = [];
  const apnsKeyId = process.env.APNS_KEY_ID;
  const apnsTeamId = process.env.APNS_TEAM_ID;
  const apnsKey = process.env.APNS_KEY_P8;
  if (iosTargets.length && apnsKeyId && apnsTeamId && apnsKey) {
    try {
      const jwt = apnsJwt(apnsKeyId, apnsTeamId, apnsKey);
      iosResults = await sendApns(
        iosTargets.map((s) => s.endpoint.slice("apns:".length)),
        jwt,
        // badge: 1 puts a red 1 on the app icon; the app clears it when opened.
        // (APNs only takes an absolute number, and the server doesn't know how
        // many unread messages each phone has, so it's always 1.)
        { aps: { alert: { title, body: (bodyText || "").slice(0, 160) }, sound: "default", badge: 1 }, url: "/" }
      );
    } catch {
      iosResults = [];
    }
  }

  // Shows up under Netlify -> Logs -> Functions -> send-push. Counts and
  // Apple's own reply codes only — no tokens or keys.
  console.log(
    JSON.stringify({
      channel,
      subscriptions: subs.length,
      targets: targets.length,
      web: webTargets.length,
      ios: iosTargets.length,
      apnsConfigured: !!(apnsKeyId && apnsTeamId && apnsKey),
      apnsReplies: iosResults.map((r) => (r ? { status: r.status, reason: (r.reason || "").slice(0, 120) } : null)),
    })
  );

  // Best-effort cleanup — RLS only lets a sender delete their own row, so this
  // only actually removes anything if the sender's own subscription died.
  const dead = [
    ...webTargets.filter((s, i) => {
      const r = webResults[i];
      return r && r.status === "rejected" && (r.reason?.statusCode === 404 || r.reason?.statusCode === 410);
    }),
    ...iosTargets.filter((s, i) => {
      const r = iosResults[i];
      return r && (r.status === 410 || (r.status === 400 && /BadDeviceToken|Unregistered/.test(r.reason || "")));
    }),
  ];
  await Promise.allSettled(
    dead.map((s) =>
      fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      })
    )
  );

  const sent = webResults.filter((r) => r.status === "fulfilled").length + iosResults.filter((r) => r && r.ok).length;
  return { statusCode: 200, body: JSON.stringify({ sent, of: targets.length }) };
};
