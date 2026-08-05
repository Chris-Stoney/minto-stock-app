# Minto Farm Records — project context & handoff

This file is read automatically by Claude Code. It hands the full picture to anyone
(e.g. Gwen) opening this project with Claude on their own computer. Read it first.

## What this is
A mobile-first farm-records / stock-book app for **Minto Pastoral Co** (7 properties:
Minto, Linleigh, Dunbar, Buckanbe, Wirrealpa, Innaminka, Magenta). It began as a Claude
artifact ("BUILD 78") and has been turned into a real, independent, hosted web app that
the team uses on their phones. Owner/GM: Chris (chris@mintopastoral.com.au). Office: Gwen.

## Where everything lives
- **Live app:** https://app.mintopastoral.com.au (Netlify URL fantastic-treacle-2147ef.netlify.app still works)
- **Code (GitHub, private):** https://github.com/Chris-Stoney/minto-stock-app
- **Hosting (Netlify):** project `fantastic-treacle-2147ef` — auto-deploys on every push to `main`.
- **Database (Supabase):** org "Minto Pastoral Co", project `minto-stock-app`,
  ref `hohokbhldedjyzbmywjp`, URL https://hohokbhldedjyzbmywjp.supabase.co (Sydney region).

## How it's built
- **Vite + React.** The entire app is one big component: `src/App.jsx` (~3,800 lines,
  ported verbatim from BUILD 78 — edit surgically).
- **Storage abstraction:** the app talks to a global `window.storage` (get/set JSON per key).
  Installed in `src/main.jsx`. Backends in `src/lib/`:
  - `storage.js` — localStorage (fallback / local dev).
  - `supabaseBackend.js` + `supabaseConfig.js` — the real shared storage. Shared keys go to
    a Supabase `store(key, value, updated_at)` table (schema in `supabase/schema.sql`);
    per-device keys (e.g. `mp2:me`) stay in localStorage.
  - The Supabase URL + anon key are committed (the anon key is public by design; security
    comes from RLS, not from hiding it).
- **Login:** `src/Gate.jsx` — the app only mounts for signed-in users (Supabase Auth,
  email + password). Sign-out lives in the app's Setup tab (Account card).
- **PWA:** `public/manifest.webmanifest` + `public/icon.svg` + `public/apple-touch-icon.png`
  make it installable to the phone home screen (full-screen, app icon).
- **Native (planned):** `capacitor.config.json` makes it Capacitor-ready; the native shell
  loads the live site (`server.url`), so web deploys update the app instantly. See `APP-STORE.md`.

## Security (already in place — do not regress)
- Netlify site visitor access = **public**.
- Supabase **RLS is ON** for `store`: policy `team access` allows only `authenticated`.
  Verified: anonymous read returns `[]`, anonymous write is 401. Only signed-in users see data.
- Users are created manually in Supabase → Authentication → Users → Add user (tick Auto Confirm).
  Public sign-ups should be OFF (Auth → Sign In / Providers → Email → Enable Sign Ups off).
- **Never** commit the Supabase *service_role* key or anyone's password. The anon key is fine.

## How to work on it (no Node needed locally)
- Edit files, then commit & push to `main` — Netlify rebuilds and redeploys in ~1 min.
  (GitHub push credentials are cached on Chris's PC; Gwen signs in on first push.)
- There is **no Node.js on these Windows machines**, so we don't run the app locally — we
  verify on the deployed Netlify URL. Builds happen in Netlify's cloud.
- Add a team member: Supabase → Authentication → Users → Add user (their email + a password,
  tick Auto Confirm). Removing someone = delete their user.
- Daily backup (optional now that it's a real DB): in the app, Setup → Export (JSON).

## Open / next steps
1. Confirm public sign-ups are disabled in Supabase.
2. AI pasture-commentary "🌱" button calls api.anthropic.com directly — works only inside the
   old artifact, not on the live site (CORS/no key). Fix = a small serverless function
   (e.g. a Netlify Function holding the API key) that the app calls instead.
3. Native apps: private distribution, both iOS + Android, cloud build (no Mac). Needs Apple
   Developer ($99/yr, D-U-N-S for the business) + Google Play ($25). Recommended build service:
   Codemagic. Free trial path meanwhile: PWA home-screen (both) + a free Android test APK.
4. Optional: custom domain, real square logo, per-user roles.

## Gotchas
- `src/App.jsx` is huge and was hand-ported once; prefer targeted edits over rewrites.
- The app auto-seeds its built-in BASELINE data into an empty database on first load.
- Data is shared and live — test destructive changes carefully; there's an Export backup.
