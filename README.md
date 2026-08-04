# Minto Pastoral — Farm Records

Mobile-first stock-book app for Minto Pastoral Co (Minto, Linleigh, Dunbar, Buckanbe,
Wirrealpa, Innaminka, Magenta). Currently **BUILD 78**, originally built as a Claude artifact.

This folder is where we turn it into a **real, independent, hosted app** with a proper
database — so the team's stock book lives somewhere solid, syncs reliably across phones,
and is backed up automatically.

---

## The plan (two tracks, running in parallel)

### Track 1 — Trial in claude.ai, starting today
Use the existing artifact so the team starts building the habit and we learn what matters
in the field. Treat it as a **trial**: export the JSON daily (Setup → Export) so we're
never exposed to data loss. See **"Team rollout checklist"** below.

### Track 2 — The real hosted app (what we build here)
Same app, same screens — but data lives in a real database and it deploys to a real web
address. Milestones:

1. **Scaffold** (done) — Vite + React project with a storage abstraction layer.
2. **Port the app** — drop BUILD 78 in, swap `window.storage` for the storage layer.
   Runs locally on `localStorage` first (no accounts needed), so we can see it working.
3. **Real database** — wire the storage layer to **Supabase** (Postgres + realtime sync
   + auth). This is what makes it shared and reliable across the team.
4. **Seed the data** — load the latest JSON export into the database as the starting point.
5. **Login** — a simple sign-in so each person is themselves and the data is protected.
6. **Deploy** — publish to a real URL (Netlify/Vercel). Add to phone home screen.

**Cost:** ~$0–25/month (Supabase + Netlify free tiers cover a farm team; a custom domain
is ~$20/yr if you want one).

---

## What I need from you to move Track 2 forward

1. **Your latest data export** — in the running artifact, go to **Setup → Export (JSON)**,
   copy it, and save it here as `seed/data.json`. (This is also your backup for today.)
2. **The current app code** — save the artifact's full source here as
   `src/App.original.jsx` (paste it into that file). I'll refactor from the on-disk copy
   so nothing gets mistranscribed.
3. **A Supabase account** — when we reach milestone 3, sign up at https://supabase.com
   (free). You create it; I'll never handle your password.

---

## Running it locally (once the app is ported)

```bash
npm install
npm run dev
```

Then open the URL Vite prints. In this first milestone, data is stored in your browser's
`localStorage` — good enough to see it working, not yet shared across devices.

---

## Team rollout checklist (Track 1 — do this today)

1. Open the shared artifact link. On the **Setup** tab, confirm it says
   **"Storage mode: shared"** at the bottom. If it says *personal* or *trial/memory*,
   reload — shared is what lets everyone see the same data.
2. Send **the same artifact link** to each team member (WhatsApp group).
3. Each person opens it on their phone and, in **Chat**, enters their name once.
4. **Add to home screen** so it opens like an app:
   - iPhone (Safari): Share → *Add to Home Screen*.
   - Android (Chrome): ⋮ menu → *Add to Home screen*.
5. **Managers only:** in Setup, add the PO approvers (names must match the Chat names),
   and check the team/contractor lists.
6. **Every day:** one person does **Setup → Export (JSON)** and pastes it somewhere safe
   (email it to Chris, or save to `seed/data.json` here). This is the safety net until
   Track 2 is live.

### Known issue to be aware of during the trial
The Marking form's "Lamb breed" field renders as a plain text box instead of a dropdown
(a small bug in the `Field` component). It still works — just type the breed. We'll fix
it in the port.
