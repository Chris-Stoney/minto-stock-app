# Native apps (iOS + Android) — plan

Decisions: **private distribution** (invite-only, not a public store listing),
**both iPhone & Android**, **cloud builds** (no Mac needed).

## How it works

We wrap the existing web app with **Capacitor**. The native app is a thin shell
that loads the live site (`capacitor.config.json` → `server.url`). So:

- Every web deploy updates everyone **instantly** — no App Store resubmission for
  day-to-day changes.
- We reuse 100% of the current app (login, database, data, camera for chat photos).
- Resubmission is only needed for native-shell changes (icon, permissions, etc.).

## Prerequisites (accounts — you set these up; start Apple now, it's the slow one)

1. **Apple Developer Program — $99/year.** Enrol at https://developer.apple.com/programs/
   under **Minto Pastoral Co** (an Organization enrolment needs a **D‑U‑N‑S number**
   for the business — free, but can take a few days to verify). This gates all iOS work.
   - Private distribution options once enrolled: **TestFlight** (invite up to 10,000
     testers by email — easiest) or **Apple Business Manager** custom app.
2. **Google Play Developer — $25 one-time.** https://play.google.com/console — for
   Android internal/closed testing (invite-only). Android test builds (APK) can be
   installed *without* this account too, for early testing.

## Build service (cloud — pick one next session)

- **Codemagic** — purpose-built for Capacitor, manages iOS signing, free tier
  (~500 build-min/mo). Recommended for least fuss.
- **GitHub Actions** — free, integrated with our repo; more setup, we manage signing.

## Roadmap

| Step | Needs | Status |
|------|-------|--------|
| Native-ready config (Capacitor) | — | ✅ done |
| Android test build (APK) in the cloud | build service | ⏳ next |
| Install APK on an Android phone to try | — | ⏳ |
| Apple Developer enrolment | $99/yr + D-U-N-S | 🔲 you |
| Google Play enrolment | $25 | 🔲 you |
| iOS build + TestFlight invite | Apple account + cloud Mac build | 🔲 |
| App icon + splash screen | a logo image | 🔲 |

## Important: finish the security lockdown first

The app is being wrapped around the **live database**. Do **not** invite the team to
an app until the database lockdown (Supabase RLS + login) is confirmed — otherwise the
app ships pointing at an open database. See the login/RLS steps from the session.
