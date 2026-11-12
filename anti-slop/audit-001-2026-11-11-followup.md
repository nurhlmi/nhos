# antislop audit 001: follow-up (2026-11-11)

Approved by the owner: **all findings (1-18)**. Mode: after (session override).

## What was fixed

| # | Fix | Evidence |
|---|---|---|
| 1 | Dark theme: primary buttons now use dark text `#0a0e16` on blue `#418dfa` | 5.90:1 (was 3.14:1) |
| 2 | Light `--warning` → `#955300` | 5.18:1 on its tint, 5.41:1 on raised surface (was 2.69:1) |
| 3 | Light `--success` → `#137a3e` | 4.72:1 on its tint (was 3.83:1) |
| 4 | Light `--destructive` → `#c0212b`, `--primary` → `#1a5bc8`; HIGH severity badge `orange-700` in light | red 4.70:1, blue 5.38:1, orange 4.68:1 on their tints; white on primary 5.96:1. Also found and fixed: notification count white-on-red in dark (3.42:1) → dark text, 5.65:1 |
| 5 | Every `—` placeholder replaced with words: "n/a", "None", "Unknown", "Not estimated", "Not published" | `grep -rn "—" src` → 0; rendered text of 10 pages has no em dash |
| 6 | Controls get a 44px minimum on touch screens (`pointer-coarse:` on buttons, inputs, selects, tabs, sidebar links, news chips, breadcrumb links); desktop density unchanged | iPhone 13 emulation, 10 pages: 0 interactive elements under 44px |
| 7 | Drawn "M" mark removed; text wordmark "nhOS" (collapsed: "nh"). Default create-next-app favicon removed; metadata declares no icon until the owner supplies a logo | No `/favicon.ico` 404 in the console |
| 8 | Asset name in the table is a real link with a visible focus ring | Tab reaches "[TEST] Kamera", focus ring present, Enter opens the detail page |
| 9 | Market value icon Sparkles → Tag (price tag) | DESIGN.md "Icon relevance" |
| 10 | Quick access icon Zap → LayoutGrid | DESIGN.md "Icon relevance" |
| 11 | "Workspace" and notification section titles in normal case, no extra tracking | Screenshots, sidebar |
| 12 | JetBrains Mono reason written in DESIGN.md (identifiers and fixed-width values only in the app UI) | DESIGN.md "Derived decisions" |
| 13 | Arrow removed from every "View all" link | `grep ArrowRight src` → 0 |
| 14 | Chart card renamed "Rate history" with the question as its heading: "How did USD/IDR move over the last month?" (follows pair and range) | Currency page |
| 15 | Empty states now give cause and next step: rates (ECB does not publish the pair → change the watchlist), news (feeds returned nothing → refresh interval and per-source status), category chart (only active/inactive count → add or change status) | `widgets.tsx`, `asset-charts.tsx` |
| 16 | Overview description: "Today's exchange rates, asset values, new vulnerabilities and tech headlines." | `overview.tsx` |
| 17 | One button: "Print or save as PDF" | E2E clicks it and renders the A4 PDF |
| 18 | 40 decorative `// -----` banners removed from 7 files; the section names stay as single-line comments. Applied migrations untouched | `grep -rnE '^\s*// -{10,}' src` → 0 |

Supporting change: `.next-local/**` added to ESLint ignores so the isolated test build is never linted.

## New finding (not fixed, needs approval)

| # | Priority | Rule | Where | Finding |
|---|---|---|---|---|
| 19 | LOW | antislop-ui (Fake Terminal Window), R-06 | `src/features/cv/templates/cv-document.tsx` (Developer Portfolio header) | The Developer Portfolio CV template opens with a `~/cv $ whoami` terminal-style header. It is a terminal costume inside the printed CV. Options: keep it as that template's identity, or replace it with a plain name header. |

## Delivery Gate

### Block 1: Hard Gate (all must be "no")
- R-02 PASS: no em dash in `src/` (grep 0) or in rendered text of 10 pages.
- R-03 PASS: iPhone 13 emulation on 10 pages, no horizontal overflow, 0 controls under 44px.
- R-17 PASS: every number comes from ECB, NVD, CISA, feeds, the database or a labelled AI estimate.
- R-18 PASS: no testimonials.
- R-23 PASS: no logo mark or icon created; text wordmark and initials avatar are honest placeholders.
- R-24 PASS: every sidebar, command-menu and profile item has a real route (smoke test: 10 pages 200).
- R-25 PASS: all audited text pairs at or above 4.5:1 in both themes (values above).
- R-26 PASS: no dead controls; the duplicate print button was merged.
- R-27 PASS: empty, loading and error states on every data view; error states seen live when CISA, news feeds and Frankfurter were unreachable during this session.
- R-28 PASS: no FAQ.
- R-32 PASS: keyboard path verified on the asset table; focus rings visible.
- R-33 PASS: all changes made in source; the comment-banner cleanup was a one-off source edit, no patch script remains in the repo.
- R-34 PASS: light and dark screenshots of overview, CVE, asset pages checked; contrast verified per theme.
- R-35 PASS: build run; click-through recorded below; console clean on the final run.
- R-36 PASS: no security/compliance/performance claims.
- R-37 PASS: DESIGN.md exists (owner's brief), dials ENERGY 1 / RHYTHM 1 / MOTION 1.
- R-38 PASS: no fabricated content; test data used for verification was removed.

### Block 2: Purpose-Gate
- R-01 PASS: no gradients beyond the subtle chart area fill (series color, reason: marks the area under the rate line).
- R-04 PASS: Lucide kept as owner override; generic AI glyphs removed; relevance written in DESIGN.md.
- R-06 PASS: Inter (owner's choice) and JetBrains Mono (identifiers) reasons written; no wide-tracked uppercase in the app UI.
- R-07, R-10, R-13, R-19, R-22 PASS: no background grid, one topbar backdrop blur, no glow, spinners and hover only, no illustrations.
- R-08 PASS: no decorative arrows.
- R-09 PASS: badges mark real states (severity, KEV, status, confidence).
- R-12 PASS: shadow only on the CV paper preview (elevation: it is a printed page).
- R-14 PASS: stat cards are uniform by design (RHYTHM 1, dense data scanning).

### Block 3: Liveliness
- Dials declared in DESIGN.md: ENERGY 1 / RHYTHM 1 / MOTION 1. Output matches: calm, uniform grids, no motion beyond hover/spinners.
- Focal point per screen: the page title + primary data card (welcome clock on Overview, rate chart on Currency, CVE feed on CVE).
- One deliberate accent: blue for primary actions, active nav and links.
- Identity motif: the source-and-freshness line ("Live fetch / Cached / Stale · source") under every external-data widget.
- Design Read: "a private data dashboard for one owner, minimalist SaaS language, dial ENERGY 1 / RHYTHM 1 / MOTION 1" (from DESIGN.md).

### Block 4: Craftsmanship & Quality Locks
- C-1 to C-5 PASS: decisions recorded in DESIGN.md; no dead controls; sections exist for the brief's modules; states, themes, breakpoints and keyboard verified; no fabricated claims.
- R-05 PASS: dashboard shell is the owner's requested layout.
- R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31 PASS: medium radius per brief, no generic CTAs, buzzword removed, owner direction applied, dark default from brief with working light theme, palette = blue + status colors on neutrals, not a clone, reasons written.

## Click-through evidence (R-35)

From `scripts/e2e.mjs` on the final build (all passed): sign in via verification link → overview; empty asset form → validation errors; create asset → detail page; edit price → saved; asset list search → "No assets match these filters"; CV personal info save, add experience, add skill, switch templates → preview updates; "Print or save as PDF" → print page renders A4 PDF; CVE detail → add to watchlist, add note, mark reviewed → watchlist shows "Reviewed (1)"; news → save article → saved list → mark as read; delete asset via confirm dialog; remove CVE, article, CV entries via confirm dialogs. Plus: `scripts/login-check.mjs`, `scripts/rls-check.mjs` (21 checks), smoke test of 10 pages, unit tests 7/7, typecheck, lint, build.

## Notes

- During verification the session's network intermittently failed DNS for `api.frankfurter.dev`, `www.cisa.gov` and timed out on `hnrss.org`. The app showed its error states (no invented data) and every check passed once the hosts answered again.
- One minified React #418 (hydration mismatch) appeared once during that outage. It did not reproduce in two later full runs (development build with full messages, and production). If it shows up again, run `pnpm dev` and share the full message.
