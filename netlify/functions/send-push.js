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

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return { statusCode: 500, body: JSON.stringify({ error: "Push isn't configured (missing VAPID keys)" }) };
  }

  const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!subsRes.ok) {
    return { statusCode: 500, body: JSON.stringify({ error: "Could not load subscriptions" }) };
  }
  const subs = await subsRes.json();
  const targets = subs.filter((s) => s.user_email !== senderEmail && (channel === "General" || s.property === channel));

  webpush.setVapidDetails("mailto:info@mintopastoral.com.au", vapidPublic, vapidPrivate);

  const notifPayload = JSON.stringify({ title, body: (bodyText || "").slice(0, 160), url: "/" });

  const results = await Promise.allSettled(
    targets.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, notifPayload)
    )
  );

  // Best-effort cleanup — RLS only lets a sender delete their own row, so this
  // only actually removes anything if the sender's own subscription died.
  const dead = targets.filter((s, i) => {
    const r = results[i];
    return r.status === "rejected" && (r.reason?.statusCode === 404 || r.reason?.statusCode === 410);
  });
  await Promise.allSettled(
    dead.map((s) =>
      fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { statusCode: 200, body: JSON.stringify({ sent, of: targets.length }) };
};
