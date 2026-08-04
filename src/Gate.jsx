import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseBackend.js";
import App from "./App.jsx";

/* Login gate. The app only mounts once a user is signed in, and every request
   to the database then carries that user's session — so the database rules
   (RLS) can refuse anyone who isn't authenticated. */

export default function Gate() {
  // No Supabase configured (local dev fallback) — run the app straight through.
  if (!supabase) return <App />;

  const [session, setSession] = useState(undefined); // undefined = still checking
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (e) => {
    e && e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr(error.message || "Could not sign in");
    setBusy(false);
  };

  if (session === undefined)
    return <div style={S.loading}>Loading…</div>;

  if (session)
    return <App onSignOut={() => supabase.auth.signOut()} userEmail={session.user?.email} />;

  return (
    <div style={S.wrap}>
      <form style={S.card} onSubmit={signIn}>
        <div style={S.brand}>Minto Pastoral</div>
        <div style={S.sub}>Farm Records — team sign in</div>
        <input
          style={S.input}
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={S.input}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <div style={S.err}>{err}</div>}
        <button style={S.btn} type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <div style={S.note}>
          No account? Ask Chris or Gwen to set one up for you.
        </div>
      </form>
    </div>
  );
}

const S = {
  loading: { fontFamily: "system-ui, sans-serif", padding: 60, textAlign: "center", color: "#6a6f60" },
  wrap: {
    fontFamily: "'Barlow', system-ui, sans-serif",
    minHeight: "100vh",
    background: "#E9E7DF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #D9D6CB",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  brand: { fontWeight: 700, fontSize: 24, color: "#2F4A33", fontFamily: "'Barlow Semi Condensed', system-ui" },
  sub: { color: "#6a6f60", fontSize: 14, marginTop: -6, marginBottom: 6 },
  input: {
    fontFamily: "inherit",
    fontSize: 16,
    padding: "11px 12px",
    border: "1px solid #C9C6B9",
    borderRadius: 9,
    background: "#FBFAF6",
    color: "#23281F",
  },
  btn: {
    fontFamily: "inherit",
    fontSize: 16,
    fontWeight: 600,
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    background: "#2F4A33",
    color: "#F4F3EC",
    cursor: "pointer",
  },
  err: { color: "#B03A2E", fontSize: 14, fontWeight: 600 },
  note: { color: "#8B887A", fontSize: 13, textAlign: "center", marginTop: 4 },
};
