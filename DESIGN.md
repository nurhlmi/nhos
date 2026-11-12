# DESIGN.md: nhOS

Design direction for nhOS – Personal Command Center. Sections 1–3 are transcribed from the owner's original brief ("6. Design System" and the product overview); they are the owner's words, not agent-invented style. Section 4 records decisions derived from them.

## 1. Identity (from the brief)

- Personal dashboard exclusive to one user: a single place for information, monitoring, asset management, technology security, news and professional profile.
- Modern SaaS dashboard with a minimalist, premium, clean and data-driven approach.

## 2. Visual direction (from the brief)

- Default theme: Dark mode.
- Optional theme: Light mode.
- Background dark navy/charcoal.
- Surface menggunakan warna sedikit lebih terang dari background.
- Primary accent: Blue.
- Success: Green.
- Warning: Amber.
- Danger: Red.
- Typography: Inter.
- Border subtle.
- Rounded corners medium.
- Subtle shadows.
- Minimal gradients.

Hindari:

- Terlalu banyak warna.
- Terlalu banyak gradient.
- Card yang terlalu besar.
- Informasi yang tidak relevan.
- Animasi berlebihan.
- Tampilan seperti template admin dashboard generik.

Utamakan information density yang baik, keterbacaan, dan visual hierarchy.

Icons: Lucide React (from the brief's technology stack).

## 3. Layout (from the brief)

- Collapsible left sidebar with icon + label, active indicator, tooltips when collapsed, mobile drawer, profile section at the bottom.
- Top navigation: breadcrumb, search command, notification indicator, theme toggle, profile dropdown, current date and time.
- Every page has a title and description; cards use subtle borders and rounded corners; consistent spacing; responsive grid.

## 4. Derived decisions

Dial: ENERGY 1 / RHYTHM 1 / MOTION 1
- ENERGY 1: "minimalist, premium, clean, data-driven"; a working tool, not a showcase.
- RHYTHM 1: dashboard grids with consistent cards; uniformity is deliberate because scanning dense data is the job.
- MOTION 1: "Animasi berlebihan" is listed under Hindari; hover and state transitions only.

Owner overrides (antislop R-37, recorded 2026-11-11):
- Lucide icons kept at the owner's request (antislop R-04 flags a single thin-stroke icon library as a generic look). Individual icons must still be relevant to their content.
- Dark default is the owner's stated direction, not "dark looks tech" (antislop R-21); the light theme ships and must work too (R-34).
- Inter is the owner's chosen typeface (antislop R-06 asks for a written reason: it is the brief's explicit choice).
- JetBrains Mono, in the app UI, is used only for identifiers and fixed-width values the eye compares column by column: CVE IDs, currency pairs, asset codes and the clock. It is never used for app headings or body text (antislop R-06). Inside the printed CV, the "Developer Portfolio" template the owner asked for uses it as that template's typographic voice.

Icon relevance (antislop R-04):
- Quick access uses a grid (LayoutGrid): it is a grid of shortcuts.
- "View all" links carry no arrow; the label already says where it goes (antislop R-08).
- Prayer times use the sun's position at each prayer: Subuh (Sunrise, dawn), Dzuhur (Sun, noon), Ashar (SunDim, low afternoon sun), Maghrib (Sunset), Isya (Moon, night). Imsak, Terbit and Dhuha are secondary and carry no icon.
