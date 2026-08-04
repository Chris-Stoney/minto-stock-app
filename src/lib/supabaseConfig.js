/* Supabase project connection (Track 2, milestone 3).
   These two values are safe to ship in the browser — the anon key is designed
   to be public; real protection comes from database Row Level Security, which
   we add before wide rollout. Env vars (VITE_SUPABASE_*) override these if set. */

export const SUPABASE_URL = "https://hohokbhldedjyzbmywjp.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaG9rYmhsZGVkanl6Ym15d2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTE0ODMsImV4cCI6MjEwMTM4NzQ4M30.Q_qVPVa1h9k5ZZxJL1eSg5KtvvjWYilVA-uOvdwDVOc";
