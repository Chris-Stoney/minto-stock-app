#!/usr/bin/env python3
"""Nightly stock check for the Minto App.

Compares the two most recent daily backups (backups/backup-YYYY-MM-DD.json)
and asks, for every property and species: did the head count change by exactly
what the records say changed it? Anything left over is "unexplained" and gets
emailed, together with what's likely behind it:

  - mobs that disappeared while still holding head
  - older records that were edited or undone after the fact
  - records pointing at a mob that isn't in the list
  - mobs below zero

It reads only the repo's backups (no secrets needed to check); sending the
email needs RESEND_API_KEY. Nothing is sent on a clean day.

Usage:
  python scripts/stock_check.py                  # print the latest day's report
  python scripts/stock_check.py --send           # ...and email it if anything's flagged
  python scripts/stock_check.py --backtest       # every consecutive pair of backups
  python scripts/stock_check.py --backtest --out reports/stock-check-backtest.md
"""
import argparse
import datetime
import glob
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

KEYS = {
    "mp2:mobs": "mobs",
    "mp2:adjust": "adjust",
    "mp2:trucking": "trucking",
    "mp2:marking": "marking",
    "mp2:moves": "moves",
    "mp2:audit": "audit",
}
MIN_HEAD = float(os.environ.get("STOCK_CHECK_MIN", "5") or 5)
DAY_MS = 86400000
CONTEXT_ACTIONS = {"New mob", "Edit mob", "Delete mob", "Undo / delete", "Delete", "Combine mobs"}


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def load(path):
    with open(path, encoding="utf-8-sig") as f:
        rows = json.load(f)
    snap = {name: [] for name in KEYS.values()}
    stamps = []
    for r in rows:
        name = KEYS.get(r.get("key"))
        if not name:
            continue
        try:
            val = json.loads(r.get("value") or "[]")
        except ValueError:
            val = []
        snap[name] = val if isinstance(val, list) else []
        stamps.append(r.get("updated_at"))
    snap["_path"] = path
    snap["_date"] = re.search(r"(\d{4}-\d{2}-\d{2})", os.path.basename(path)).group(1)
    snap["_ms"] = max([ms for ms in (to_ms(s) for s in stamps) if ms] or [0])
    return snap


def to_ms(s):
    if not s:
        return 0
    try:
        return int(datetime.datetime.fromisoformat(str(s).replace("Z", "+00:00")).timestamp() * 1000)
    except ValueError:
        return 0


def effects(kind, rec, mobs):
    """Head change a record makes: list of ((property, species), delta)."""
    out = []
    if kind == "adjust":
        mob = mobs.get(rec.get("mobId")) or {}
        key = (rec.get("property") or mob.get("property") or "?", rec.get("species") or mob.get("species") or "?")
        out.append((key, num(rec.get("delta"))))
    elif kind == "trucking":
        t = rec.get("ttype")
        head = round(num(rec.get("head")))
        if t == "Purchase":
            out.append(((rec.get("toProperty") or rec.get("property") or "?", rec.get("species") or "?"), float(head)))
        else:
            loads = rec.get("loads") or ({rec["mobId"]: head} if rec.get("mobId") else {})
            for mid, n in loads.items():
                n = round(num(n))
                if n <= 0:
                    continue
                mob = mobs.get(mid) or {}
                src = mob.get("property") or rec.get("fromProperty") or rec.get("property") or "?"
                sp = mob.get("species") or rec.get("species") or "?"
                out.append(((src, sp), float(-n)))
                if t == "Property transfer" and rec.get("toProperty"):
                    out.append(((rec["toProperty"], sp), float(n)))
    elif kind == "marking":
        mum = mobs.get(rec.get("mobId")) or {}
        n = round(num(rec.get("msHead")) + num(rec.get("femHead")) + num(rec.get("maleHead")))
        out.append(((rec.get("property") or mum.get("property") or "?", mum.get("species") or "Sheep"), float(n)))
    return out


def totals(mob_list):
    t = {}
    for m in mob_list:
        key = (m.get("property") or "?", m.get("species") or "?")
        t[key] = t.get(key, 0.0) + num(m.get("head"))
    return t


def describe(kind, rec):
    date = rec.get("date") or ""
    name = rec.get("mobName") or ""
    if kind == "trucking":
        return f"{rec.get('ttype', 'Trucking')} {round(num(rec.get('head')))} hd {name} ({date})".strip()
    if kind == "adjust":
        return f"{rec.get('reason', 'Adjustment')} {rec.get('delta', '')} {name} ({date})".strip()
    return f"Marking {name} ({date})".strip()


def compare(a, b):
    mobs = {m.get("id"): m for m in a["mobs"] if m.get("id")}
    mobs.update({m.get("id"): m for m in b["mobs"] if m.get("id")})
    explained = {}
    changed = []  # older records edited / undone
    cutoff = (a["_ms"] or 0) - 2 * DAY_MS
    for kind in ("adjust", "trucking", "marking"):
        ai = {r.get("id"): r for r in a[kind] if r.get("id")}
        bi = {r.get("id"): r for r in b[kind] if r.get("id")}

        def add(sign, rec):
            for key, d in effects(kind, rec, mobs):
                explained[key] = explained.get(key, 0.0) + sign * d

        for rid, rec in bi.items():
            if rid not in ai:
                add(1, rec)
            elif sorted(effects(kind, rec, mobs)) != sorted(effects(kind, ai[rid], mobs)):
                add(-1, ai[rid])
                add(1, rec)
                if num(ai[rid].get("createdAt")) < cutoff:
                    changed.append("Edited " + describe(kind, ai[rid]) + " → now " + describe(kind, rec))
        for rid, rec in ai.items():
            if rid not in bi:
                add(-1, rec)
                if num(rec.get("createdAt")) < cutoff:
                    changed.append("Undone / deleted " + describe(kind, rec))

    ta, tb = totals(a["mobs"]), totals(b["mobs"])
    rows = []
    for key in sorted(set(ta) | set(tb) | set(explained)):
        was, now = ta.get(key, 0.0), tb.get(key, 0.0)
        exp = explained.get(key, 0.0)
        un = (now - was) - exp
        rows.append({"property": key[0], "species": key[1], "was": was, "now": now, "explained": exp, "unexplained": un})
    flagged = [r for r in rows if abs(r["unexplained"]) >= MIN_HEAD]

    # Mobs that left the list while holding head and weren't folded into another
    # mob by a merged move. Only worth listing against a flagged property.
    merged_ids = {
        (mv.get("mobSnapshot") or {}).get("id") for mv in b["moves"] if mv.get("merged") and mv.get("mobSnapshot")
    }
    now_ids = {m.get("id") for m in b["mobs"]}
    flagged_keys = {(r["property"], r["species"]) for r in flagged}
    vanished = []
    for m in a["mobs"]:
        if m.get("id") in now_ids or m.get("id") in merged_ids or abs(num(m.get("head"))) < 1:
            continue
        if (m.get("property") or "?", m.get("species") or "?") in flagged_keys:
            vanished.append(f"{name_of(m)} — {round(num(m.get('head')))} hd ({m.get('property')}) is no longer in the mob list")

    orphans = []
    known = set(mobs)
    for kind in ("adjust", "trucking", "marking", "moves"):
        old_ids = {r.get("id") for r in a[kind]}
        for rec in b[kind]:
            if rec.get("id") in old_ids:
                continue
            ids = list((rec.get("loads") or {}).keys()) + ([rec["mobId"]] if rec.get("mobId") else [])
            missing = [i for i in ids if i not in known]
            if missing:
                orphans.append(f"{describe(kind, rec) if kind != 'moves' else 'Move ' + (rec.get('mobName') or '')} points at a mob that isn't in the list")

    negatives = [
        f"{name_of(m)} — {round(num(m.get('head')))} hd ({m.get('property')}, {m.get('paddock') or 'no paddock'})"
        for m in b["mobs"]
        if num(m.get("head")) < 0
    ]

    lo, hi = a["_ms"], b["_ms"]
    props = [r["property"].lower() for r in flagged]
    context = []
    if flagged and lo and hi:
        for e in sorted(b["audit"], key=lambda e: num(e.get("ts"))):
            if lo < num(e.get("ts")) <= hi and e.get("action") in CONTEXT_ACTIONS:
                text = (e.get("summary") or "").lower()
                if any(p in text for p in props):
                    when = datetime.datetime.fromtimestamp(num(e["ts"]) / 1000, datetime.timezone.utc).strftime("%d %b %H:%M UTC")
                    context.append(f"{when} {str(e.get('user', '')).split('@')[0]} — {e.get('action')}: {e.get('summary')}")
    return {
        "from": a["_date"],
        "to": b["_date"],
        "rows": rows,
        "flagged": flagged,
        "vanished": vanished,
        "changed": changed,
        "orphans": orphans,
        "negatives": negatives,
        "context": context[:12],
    }


def name_of(m):
    bits = [m.get("breed"), m.get("tag"), m.get("cls"), m.get("status")]
    return " · ".join(str(x) for x in bits if x) or "Mob"


def has_findings(r):
    return bool(r["flagged"] or r["changed"] or r["orphans"] or r["negatives"])


def fmt(n):
    n = round(n)
    return f"+{n:,}" if n > 0 else f"{n:,}"


def to_text(r):
    out = [f"Stock check — {r['from']} → {r['to']}"]
    if not has_findings(r):
        out.append("  All clear: every head-count change is explained by the records.")
        return "\n".join(out)
    if r["flagged"]:
        out.append(f"  Unexplained head changes (≥ {MIN_HEAD:g}):")
        for x in r["flagged"]:
            out.append(
                f"    {x['property']} · {x['species']}: {x['was']:,.0f} → {x['now']:,.0f} "
                f"(records explain {fmt(x['explained'])}, unexplained {fmt(x['unexplained'])})"
            )
    for title, items in (
        ("Mobs gone from the list while holding stock", r["vanished"]),
        ("Older records edited or undone", r["changed"]),
        ("Records pointing at a missing mob", r["orphans"]),
        ("Mobs below zero", r["negatives"]),
        ("Changes made in that window", r["context"]),
    ):
        if items:
            out.append(f"  {title}:")
            out.extend("    - " + i for i in items)
    return "\n".join(out)


def to_html(r):
    p = ['<div style="font-family:system-ui,Arial,sans-serif;color:#23281F;max-width:640px">']
    p.append('<h2 style="color:#2F4A33">Minto App — stock check</h2>')
    p.append(f'<p style="color:#6a6f60">Backups {r["from"]} → {r["to"]}</p>')
    if r["flagged"]:
        p.append(f'<h3 style="color:#B03A2E">Head changes the records don\'t explain (≥ {MIN_HEAD:g})</h3>')
        p.append('<table style="border-collapse:collapse;width:100%"><tr style="text-align:left;color:#6a6f60">'
                 "<th>Property</th><th>Species</th><th>Was</th><th>Now</th><th>Records explain</th><th>Unexplained</th></tr>")
        for x in r["flagged"]:
            p.append(
                f'<tr><td>{html.escape(x["property"])}</td><td>{html.escape(x["species"])}</td>'
                f'<td>{x["was"]:,.0f}</td><td>{x["now"]:,.0f}</td><td>{fmt(x["explained"])}</td>'
                f'<td style="color:#B03A2E"><b>{fmt(x["unexplained"])}</b></td></tr>'
            )
        p.append("</table>")
    for title, items, colour in (
        ("Mobs gone from the list while holding stock", r["vanished"], "#B03A2E"),
        ("Older records edited or undone", r["changed"], "#C25E1F"),
        ("Records pointing at a missing mob", r["orphans"], "#C25E1F"),
        ("Mobs below zero", r["negatives"], "#B03A2E"),
        ("What was changed in that window", r["context"], "#2E7F8F"),
    ):
        if items:
            p.append(f'<h3 style="color:{colour}">{title}</h3><ul>')
            p.extend(f"<li>{html.escape(i)}</li>" for i in items)
            p.append("</ul>")
    p.append(
        '<p style="color:#6a6f60;font-size:13px">Counts per property and species, from the daily backups. '
        "A same-day mistake that was fixed the same day nets out and won't show.</p></div>"
    )
    return "".join(p)


def send(subject, body_html):
    key = os.environ.get("RESEND_API_KEY", "").strip()
    to_raw = os.environ.get("STOCK_CHECK_TO", "").strip() or "gwen@mintopastoral.com.au"
    to = [e.strip() for e in to_raw.split(",") if e.strip()]
    sender = os.environ.get("ALERT_FROM", "").strip() or "Minto App <onboarding@resend.dev>"
    if not key:
        print("RESEND_API_KEY not set — would have sent:", subject)
        return False
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps({"from": sender, "to": to, "subject": subject, "html": body_html}).encode(),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "minto-app-stock-check/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print("Sent:", resp.status, resp.read().decode()[:200])
        return True
    except urllib.error.HTTPError as e:
        print("Resend error:", e.code, e.read().decode()[:300])
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="backups")
    ap.add_argument("--send", action="store_true")
    ap.add_argument("--backtest", action="store_true")
    ap.add_argument("--out")
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.dir, "backup-????-??-??.json")))
    if len(files) < 2:
        print("Need at least two backups to compare.")
        return 0

    if args.backtest:
        lines = [f"# Stock check back-test ({len(files)} backups, threshold {MIN_HEAD:g} head)", ""]
        flagged_days = 0
        prev = load(files[0])
        for f in files[1:]:
            cur = load(f)
            r = compare(prev, cur)
            if has_findings(r):
                flagged_days += 1
            lines.append("```\n" + to_text(r) + "\n```")
            prev = cur
        lines.insert(1, f"{flagged_days} of {len(files) - 1} day-pairs flagged.\n")
        text = "\n".join(lines)
        if args.out:
            os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write(text + "\n")
            print(f"Wrote {args.out} — {flagged_days} of {len(files) - 1} day-pairs flagged.")
        else:
            print(text)
        return 0

    r = compare(load(files[-2]), load(files[-1]))
    print(to_text(r))
    if args.send and has_findings(r):
        n = len(r["flagged"])
        subject = f"Minto stock check — {n} unexplained change{'s' if n != 1 else ''} ({r['to']})" if n else f"Minto stock check — items to review ({r['to']})"
        if not send(subject, to_html(r)):
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
