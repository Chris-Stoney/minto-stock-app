/* ============================================================
   Storage abstraction layer.

   BUILD 78 talks to a global `window.storage` with this shape:

     await window.storage.get(key, shared)  -> { value: string } | null
     await window.storage.set(key, value, shared) -> void

   Milestone 2 (now): back it with localStorage so the app runs on one
   device with no accounts. The `shared` flag is ignored here.

   Milestone 3 (later): swap the body of get/set to call Supabase, so the
   same interface becomes real, shared, backed-up storage. Nothing in the
   app component needs to change — only this file.
   ============================================================ */

const PREFIX = "mp2-local:";

export const localStorageBackend = {
  async get(key /*, shared */) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? null : { value: raw };
    } catch {
      return null;
    }
  },
  async set(key, value /*, shared */) {
    try {
      window.localStorage.setItem(PREFIX + key, value);
    } catch (e) {
      // Quota or private-mode failure — surface it so the app's fallback kicks in.
      throw e;
    }
  },
};

// When Supabase is wired up, we'll export a `supabaseBackend` with the same
// two methods and switch which one main.jsx installs.
export function installStorage(backend) {
  window.storage = backend;
}
