# When something needs fixing — quick guide (Gwen)

You don't need to be technical. You describe the problem to Claude in plain words,
Claude does the fix and publishes it. Here's the whole loop.

## One-time setup on your computer
1. Install **Claude Code** (the desktop app) and sign in with **your own Claude account**.
2. Get the project onto your machine once — clone it:
   ```
   git clone https://github.com/Chris-Stoney/minto-stock-app.git
   ```
3. Open that `minto-stock-app` folder in Claude Code. It automatically reads `CLAUDE.md`
   and knows the entire project — what it is, how it's built, what's been done.

## When the crew reports a problem
1. Open the project in Claude Code.
2. **Describe what happened in plain English** — exactly what you or the crew saw.
   Examples that worked well: *"photos disappear from chat after a refresh"*,
   *"won't load on one iPhone"*, *"a mob's numbers look wrong"*. A screenshot helps a lot.
3. Claude investigates, makes the fix, and pushes it. **Netlify rebuilds automatically
   (~1 minute)** and the fix is live for everyone — they just close and reopen the app.
4. If a fix needs a dashboard change (add a user, a Supabase setting), Claude walks you
   through the clicks. You have the access.

## Everyday admin (no Claude needed)
- **Add a team login:** Supabase → Authentication → Users → **Add user** → their email +
  a password, tick **Auto Confirm** → give them the app link + password.
- **Remove someone:** delete their user in Supabase (revokes their access).
- **See who did what:** in the app → **Setup → Activity log**.

## If a change ever makes things worse (undo)
- Just tell Claude: **"undo the last change."** Claude reverts the code and pushes it, and
  Netlify redeploys the previous version automatically — usually within a minute.
- Everything is reversible, so it's safe to try a fix. If unsure, undo and wait for Chris.

## If data ever needs restoring
- A dated backup of everything is saved automatically each day in the repo under `backups/`.
  Ask Claude to restore a specific day if something important is lost.

## Key links
- **App:** https://app.mintopastoral.com.au
- **Code:** https://github.com/Chris-Stoney/minto-stock-app
- **Database (Supabase):** https://supabase.com/dashboard → project *minto-stock-app*
- **Hosting (Netlify):** Chris's account (only needed for rare hosting changes)

## Golden rule
Nothing you and Claude do is permanent — the code is versioned and the data is backed up.
When in doubt, describe the problem, let Claude propose a fix, and undo if it's not right.
