/* ============================================================
   Supabase storage backend (Track 2, milestone 3).

   Same interface as the localStorage backend:
     get(key, shared) -> { value } | null
     set(key, value, shared) -> void

   Rule: `shared === true` keys (mobs, moves, chat, ...) live in Supabase so
   the whole team shares them. `shared === false` keys (e.g. "mp2:me", this
   device's name) stay in localStorage — they're meant to be per-device.

   Wire-up happens in main.jsx once .env.local has the Supabase URL + anon key.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";
import { localStorageBackend } from "./storage.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

export const supabaseBackend = {
  async get(key, shared) {
    if (!shared || !supabase) return localStorageBackend.get(key, shared);
    const { data, error } = await supabase
      .from("store")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? { value: data.value } : null;
  },

  async set(key, value, shared) {
    if (!shared || !supabase) return localStorageBackend.set(key, value, shared);
    const { error } = await supabase
      .from("store")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) throw error;
  },
};
