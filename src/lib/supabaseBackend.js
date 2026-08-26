/* ============================================================
   Supabase storage backend (Track 2, milestone 3).

   Same interface as the localStorage backend:
     get(key, shared) -> { value } | null
     set(key, value, shared) -> void

   Rule: `shared === true` keys (mobs, moves, chat, ...) live in Supabase so
   the whole team shares them. `shared === false` keys (e.g. "mp2:me", this
   device's name) stay in localStorage — they're meant to be per-device.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";
import { localStorageBackend } from "./storage.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig.js";

const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

export const supabaseBackend = {
  async get(key, shared) {
    if (!shared || !supabase) return localStorageBackend.get(key, shared);
    const { data, error } = await supabase
      .from("store")
      .select("value, updated_at")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? { value: data.value, updatedAt: data.updated_at } : null;
  },

  async set(key, value, shared) {
    if (!shared || !supabase) return localStorageBackend.set(key, value, shared);
    const { error } = await supabase
      .from("store")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) throw error;
  },

  /* Optimistic-concurrency write: succeeds only if the row's updated_at still
     matches expectedUpdatedAt (i.e. nobody else has written to this key since
     the caller last read it). Two people saving a record of the same type
     seconds apart both do a read-merge-write; without this check, whichever
     write lands second silently overwrites the first person's new record with
     a version merged from data that predates it. Returns true on success,
     false on a conflict (caller should re-read and retry), and throws on a
     real error. expectedUpdatedAt === null means "the key didn't exist yet". */
  async casSet(key, value, expectedUpdatedAt, shared) {
    if (!shared || !supabase) {
      await localStorageBackend.set(key, value, shared);
      return true;
    }
    if (expectedUpdatedAt == null) {
      const { error } = await supabase.from("store").insert({ key, value });
      if (!error) return true;
      if (error.code === "23505") return false; // someone else created it first
      throw error;
    }
    const { data, error } = await supabase
      .from("store")
      .update({ value })
      .eq("key", key)
      .eq("updated_at", expectedUpdatedAt)
      .select("key");
    if (error) throw error;
    return data.length > 0;
  },
};
