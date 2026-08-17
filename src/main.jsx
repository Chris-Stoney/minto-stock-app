import React from "react";
import { createRoot } from "react-dom/client";
import { installStorage, localStorageBackend } from "./lib/storage.js";
import { supabase, supabaseBackend } from "./lib/supabaseBackend.js";
import Gate from "./Gate.jsx";

// Install the storage backend BEFORE anything mounts, so window.storage exists
// when App's startup probe runs. Use Supabase when configured (shared, backed-up),
// otherwise fall back to this device's localStorage.
installStorage(supabase ? supabaseBackend : localStorageBackend);

// Registered for push notifications only — no offline caching.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Gate />
  </React.StrictMode>
);
