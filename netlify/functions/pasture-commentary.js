/* Proxies the pasture-commentary prompt to the Anthropic API using a server-side
   key (ANTHROPIC_API_KEY, set in Netlify site settings). The old artifact could
   call api.anthropic.com straight from the browser because claude.ai injected
   auth for that domain; a plain hosted site has no such key, and the Anthropic
   API doesn't allow browser CORS calls anyway — so this function is the fix.

   Requires a valid Supabase session (same login as the app) so the key can't be
   spent by anyone who finds the function URL. */

/* Same values as src/lib/supabaseConfig.js, duplicated here rather than
   imported — Netlify's function bundler doesn't reliably resolve relative
   imports that reach outside the netlify/functions folder, and a broken
   function blocks the whole site deploy, not just itself. The anon key is
   safe to duplicate: it's designed to be public (see that file's comment). */
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  const userCheck = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey },
  });
  if (!userCheck.ok) {
    return { statusCode: 401, body: JSON.stringify({ error: "Session expired — sign in again" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI commentary isn't configured yet (missing ANTHROPIC_API_KEY)" }),
    };
  }

  let prompt;
  try {
    ({ prompt } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }
  if (!prompt || typeof prompt !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Anthropic API error" }),
      };
    }
    const text = (data.content || [])
      .map((i) => (i.type === "text" ? i.text : ""))
      .filter(Boolean)
      .join("\n");
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach Anthropic API" }) };
  }
};
