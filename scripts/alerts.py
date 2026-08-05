#!/usr/bin/env python3
"""Daily email alerts for Minto Farm Records.

Reads the shared data straight from Supabase (service key), and emails a digest
ONLY when there's something worth flagging:
  - WHP/ESI: mobs currently inside a withholding period.
  - Purchase orders: any still awaiting approval.

Sends via Resend (https://resend.com). Runs from GitHub Actions (see alerts.yml).
Push/pop-up notifications come later once the native apps are live.
"""
import os
import sys
import json
import datetime
import urllib.request
import urllib.error

SB_URL = os.environ["SB_URL"].rstrip("/")
SB_KEY = os.environ["SB_KEY"]
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
ALERT_FROM = os.environ.get("ALERT_FROM", "").strip() or "Minto Farm Records <onboarding@resend.dev>"
ALERT_TO = [e.strip() for e in os.environ.get("ALERT_TO", "").split(",") if e.strip()] or [
    "chris@mintopastoral.com.au",
    "gwen@mintopastoral.com.au",
]
APP_URL = os.environ.get("APP_URL", "https://fantastic-treacle-2147ef.netlify.app")

today = datetime.date.today().isoformat()


def fetch(key):
    req = urllib.request.Request(
        f"{SB_URL}/rest/v1/store?key=eq.{key}&select=value",
        headers={"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.load(r)
    if not rows:
        return []
    try:
        return json.loads(rows[0]["value"])
    except (KeyError, json.JSONDecodeError):
        return []


def money(v):
    try:
        return "${:,.0f}".format(float(v))
    except (TypeError, ValueError):
        return f"${v}"


health = fetch("mp2:health")
orders = fetch("mp2:orders")

# WHP/ESI still active (clear date today or later)
whp = []
for h in health:
    clears = [d for d in (h.get("whpClear"), h.get("esiClear")) if d]
    active = [d for d in clears if d >= today]
    if active:
        whp.append((h, min(active), max(active)))
whp.sort(key=lambda x: x[2])  # soonest-clearing first

pending = [o for o in orders if o.get("status") == "Pending"]

if not whp and not pending:
    print("Nothing to alert — no email sent.")
    sys.exit(0)

# Build the email
parts = ["<div style=\"font-family:system-ui,Arial,sans-serif;color:#23281F;max-width:600px\">"]
parts.append(f"<h2 style=\"color:#2F4A33\">Minto Farm Records — daily alerts</h2>")
parts.append(f"<p style=\"color:#6a6f60\">{today}</p>")

if whp:
    parts.append("<h3 style=\"color:#B03A2E\">⚠ Within withholding (WHP/ESI) — do not sell early</h3><ul>")
    for h, first, last in whp:
        name = h.get("mobName", "Mob")
        prod = h.get("product", "")
        prop = h.get("property", "")
        parts.append(
            f"<li><b>{name}</b> — {prod} ({prop}) · clear by <b>{last}</b></li>"
        )
    parts.append("</ul>")

if pending:
    parts.append("<h3 style=\"color:#2E7F8F\">Purchase orders awaiting approval</h3><ul>")
    for o in pending:
        parts.append(
            f"<li>{o.get('category','')}: {o.get('item','')} — {money(o.get('amount'))} "
            f"· {o.get('supplier','')} · {o.get('property','')}"
            f"{' · raised by ' + o.get('requestedBy') if o.get('requestedBy') else ''}</li>"
        )
    parts.append("</ul>")

parts.append(
    f"<p style=\"margin-top:20px\"><a href=\"{APP_URL}\" "
    f"style=\"background:#2F4A33;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none\">"
    f"Open the app</a></p>"
)
parts.append("</div>")
html = "".join(parts)

bits = []
if whp:
    bits.append(f"{len(whp)} in withholding")
if pending:
    bits.append(f"{len(pending)} PO{'s' if len(pending) != 1 else ''} to approve")
subject = "Minto alerts — " + ", ".join(bits)

if not RESEND_API_KEY:
    print("RESEND_API_KEY not set — would have sent:", subject)
    print(html)
    sys.exit(1)

payload = {"from": ALERT_FROM, "to": ALERT_TO, "subject": subject, "html": html}
req = urllib.request.Request(
    "https://api.resend.com/emails",
    data=json.dumps(payload).encode(),
    headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("Sent:", r.status, r.read().decode()[:200])
except urllib.error.HTTPError as e:
    print("Resend error:", e.code, e.read().decode()[:300])
    sys.exit(1)
