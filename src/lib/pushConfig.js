/* VAPID public key for Web Push (Chat notifications). Safe to ship in the
   browser — same reasoning as the Supabase anon key: this is the public half
   of the key pair, real protection is the matching private key, which only
   lives server-side as a Netlify environment variable (never in this repo). */
export const VAPID_PUBLIC_KEY =
  "BLOtvUT7GTAkqRKVEzN__DEkc5mRqHHMa06kXhhRTH9e5EAHxDK_3ZejVytjcb3f45ATlyka28fmFG9tCNe9GSc";
