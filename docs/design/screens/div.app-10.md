# 11 · One course can't fit · Others still schedule

- PNG: `div.app-10.png` · Figma node `68:3559` (inside `section#state-11` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "AB 1533 warning returns; the three compatible courses remain on the calendar." · Static screen, no interactions.
- Mix of the regular planner ([`div.app-6.md`](div.app-6.md)) and the "needs attention" parts ([`div.app-7.md`](div.app-7.md)). Only the course row below is new; one Figma call was made for it (v1 node `30:13324`).

## Scenario
Four courses added. AB 1533 clashes with AE 2320's lecture, but instead of "no schedule", GoatPlan schedules the other three (1 schedule fits) and flags AB 1533. AE 2320's lab CX02 is locked.

## Sidebar
- Label row: "Your courses" · **"4 added"** (not "selected").
- AE 2320 (lock icon, "CL01 · Lab CX02"), AE 2410, AE 2210: unselected rows.
- **AB 1533 — "doesn't fit" course row** (192 × 164):
  - bg `--color-unfit-surface`, border 1px `--color-unfit-line`, radius 10, padding 12 / 10, gap 9. Swatch `--color-course-2-swatch`.
  - Info column (gap 3): "AB 1533" (11px / 700) · "Elementary Arabic III" (10px / 400 / lh 16) · "C01" (9px / 400 / lh 14.4, muted).
  - **Warning label** (5.5 above, gap 4): warning-triangle icon 12 + **"Doesn’t fit"** — 10px, 650, line-height 14.5, `--color-unfit-ink`.
  - Reason, 9px / 400 / line-height 14.4, `--color-ink-muted`, two lines: **"Clashes with AE 2320 lecture"** / **"Mon, Tue, Thu, Fri · 9:00–9:50 AM"**. ~5.5 below.
  - **Small outline button "Remove course"**: bg `--color-surface`, border 1px `--color-warning-line`, radius 5, padding 4 / 6, label 9px / 570 / line-height 10.8, `--color-ink`. Hugs its text (~81 × 21).

## Header
- Switcher: single pill **"Schedule 1 of 1"** (normal accent style, not the warning pill).
- Subtitle: **"3 courses scheduled · 1 course needs attention"**.
- Save schedule: **enabled** (the three that fit can be saved).
- Preferences: same as state 07 but **no Sort control**.

## Banner
Same warning banner as state 08: **"AB 1533 doesn’t fit."** (700) + **" Your other 3 courses still have 1 schedule that fits."** (400).

## Calendar
Same as state 07 (compact blocks, 8:30 AM–4:30 PM, early band, Work Tue/Fri). No clash blocks: AB 1533 isn't drawn. AE 2320 CX02 Thu 3:00–3:50 PM is selected and shows a lock icon.

## Details panel — "Needs attention" (AB 1533)
1. Kicker "Needs attention", h2 **"AB 1533"**, title "Elementary Arabic III".
2. Issue box (252 × 134):
   - h3 **"Doesn’t fit this schedule"**
   - Body **"AB 1533 C01 clashes with AE 2320 CL01 on Mon, Tue, Thu, Fri, 9:00–9:50 AM. The other courses remain scheduled."**
3. Section choice card (normal white style): "Lecture C01" · "Only lecture" · **"Mon, Tue, Thu, Fri · 9:00 AM–9:50 AM"** · **"Olin Hall 126"** · **"17 of 18 seats open"** · instructor block: "Mohammed El Hamzaoui" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md)).
4. "Ways to fix it": primary **"Remove AB 1533"** (× icon), secondary **"Check another term"** (calendar icon).

## Interactive states
- "Remove course" in the sidebar and "Remove AB 1533" in the panel do the same thing.
- Save is enabled even though one course needs attention.

## Data
- Two engine runs are implied: all four courses (`total: 0`, `clashingPairs` AB 1533 + AE 2320), then the plan without AB 1533 (1 schedule). The calendar and switcher show the second run.
- Non-consecutive days are listed by name: "Mon, Tue, Thu, Fri". Consecutive Mon–Fri collapses to "Mon–Fri".
- "4 added" counts every course in the plan, including the one that doesn't fit.
