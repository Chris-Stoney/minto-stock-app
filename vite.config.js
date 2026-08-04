import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Mobile-friendly dev server: host:true lets you open it from a phone on the same
// network (Vite prints a Network: URL you can use on the handset).
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
});
