import React from "react";
import { createRoot } from "react-dom/client";
import { installStorage, localStorageBackend } from "./lib/storage.js";
import App from "./App.jsx";

// Install the storage backend BEFORE the app mounts, so window.storage exists
// when App's startup probe runs. Milestone 2 uses localStorage; milestone 3
// swaps this one line for the Supabase backend.
installStorage(localStorageBackend);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
