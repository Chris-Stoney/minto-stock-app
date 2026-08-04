# Cloud setup — your account homework

Three free accounts. You create them (you own them, and I never see your passwords);
I drive everything from the code side. Do them in this order. Ballpark: 20–30 minutes.

Each account uses your work email (chris@mintopastoral.com.au). Where a password is
needed, use your password manager. Tell me once each step is done and I'll take it from there.

---

## 1. GitHub — where the code lives
- Sign up at https://github.com/signup
- Create a new **private** repository named `minto-stock-app` (don't add a README —
  we already have one).
- Copy the repo URL it gives you (looks like `https://github.com/<you>/minto-stock-app.git`)
  and paste it back to me. I'll push the code up.

## 2. Supabase — the database (shared, backed-up storage)
- Sign up at https://supabase.com (sign in with GitHub is easiest).
- Create a new project:
  - Name: `minto-stock-app`
  - Database password: generate one in your password manager and save it.
  - Region: **Sydney** (closest to the properties).
- Once it finishes provisioning, from **Project Settings → API** copy two values back to me:
  - **Project URL**
  - **anon public** key
  (The anon key is safe to share and is meant to live in the browser — real protection
  comes from database rules we'll add.)
- I'll then give you the `schema.sql` to paste into **SQL Editor → Run**, and we seed
  your exported data.

## 3. Netlify — the hosting (the real web address)
- Sign up at https://netlify.com (sign in with GitHub).
- **Add new site → Import from GitHub → pick `minto-stock-app`.**
- Build settings will auto-fill from `netlify.toml` (build `npm run build`, publish `dist`).
- Add the two Supabase values as environment variables (I'll tell you exactly where):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Deploy. Netlify gives you a URL like `minto-stock-app.netlify.app` — that's the app.
  (We can point a nicer domain at it later.)

---

## Also drop these two files in (so I can port the app)
1. **`seed/data.json`** — your latest export from the artifact (Setup → Export → copy →
   save into that file). This is both the database seed *and* today's backup.
2. **`src/App.original.jsx`** — the full artifact source (paste the whole file in). I
   refactor from the on-disk copy so nothing gets mistyped.
