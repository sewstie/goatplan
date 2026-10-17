# 08 · No schedule fits · Course clash

- PNG: `div.app-7.png` · Figma node `30:11963` (inside `section#state-08`) · frame 1680 × 800
- Figma caption: "Exact overlapping lectures, with remove-course and other-term fixes." · Static screen, no interactions.
- Starts from the regular planner [`div.app-6.md`](div.app-6.md). This file is the reference for the **"no schedule fits" parts**: warning pill, banner, clash blocks and the "Needs attention" panel. States 09–10 reuse them.

## Scenario
Four courses. AB 1533 C01 and AE 2320 CL01 meet at the same time (Mon, Tue, Thu, Fri 9:00–9:50 AM), so no schedule exists. AE 2320's lab CX02 is locked. AB 1533 is the selected course.

## Layout
```
main.workspace
├── header            title + "0 schedules fit" pill
├── Preferences row   (no Sort control)
├── div.banner        1416 × 35.5, full width
└── div.content-grid  calendar + "Needs attention" panel (580 high)
```
No variant strip.

## Sidebar
"Your courses" · **"4 selected"**:
- AE 2320 — unselected, swatch `--color-course-1`, **lock icon** after the code, "CL01 · Lab CX02".
- AE 2410 — unselected, peach swatch, "C01".
- AE 2210 — unselected, yellow swatch, "C01".
- **AB 1533** — **selected** (fill `--color-surface-selected`), swatch `--color-course-2-swatch` (the same peach as AE 2410 in the design), title "Elementary Arabic III", sub "C01".

## Header
- **Warning count pill** in place of the switcher: "0 schedules fit". Same shape as the count pill (radius 8, padding 5.5 / 10, 12px, 650) but bg `--color-alert-soft`, border 1px `--color-alert-line`, text `--color-alert`. 109 × 31.
- Subtitle: **"4 courses · AB 1533 and AE 2320 overlap"**.
- Save schedule: **disabled**.

## Banner (`div.banner`)
Full width under the preferences row (12 gap above and below).
- bg `--color-warning-surface`, radius 10, padding 10 / 12, row gap 9, centered.
- Warning-triangle icon 15 × 15.
- One line, 10px, line-height 15.5, `--color-warning-ink`: **"No schedule fits."** in 700, then in 400: " AB 1533 C01 and AE 2320 CL01 overlap · Mon, Tue, Thu, Fri, 9:00–9:50 AM."

## Calendar
- Same range and compact block sizes as state 07 (grid 489.5 high). Caption "Auto-fit · 8:30 AM–4:30 PM". Early band and Work blocks stay.
- **Clash blocks**: both clashing sections are drawn in the clash style and **share the column, half width each** (left: AE 2320 CL01, right: AB 1533 C01, ~2px apart).
  - bg `--color-clash-surface`, border 1px `--color-clash-line`, radius 6, padding 3 / 5, gap 2.
  - Text `--color-clash-ink`: code 9px / 700, section 8px / 400, time 7.5px / 400. **No room line.**
  - AE 2320 CL01 stays in the left half on all five days, including Wednesday where AB 1533 doesn't meet. AB 1533 C01 is on Mon, Tue, Thu, Fri (room "Olin Hall 126" only in the layer label).
- Other blocks are normal: AE 2410 (peach), AE 2210 (yellow), AE 2320 CX02 Thu 3:00–3:50 PM (selected style with lock icon).

## Details panel — "Needs attention" variant
Padding 20 / 16, column.
1. Kicker **"Needs attention"**: 9px, 650, line-height 13, `--color-attention`.
2. h2 **"AB 1533"** (21px, 700, −0.55), 4 above. Title **"Elementary Arabic III"** (11px, 510), ~12 below.
3. **Issue box** (`div.issue-box`): 238 × 106, bg `--color-issue-surface`, border 1px `--color-issue-line`, radius 10, padding 11, column gap 6.
   - Warning-triangle icon 18.
   - h3 **"Two lectures overlap"**: 12px, 700, line-height 18, `--color-ink`.
   - **"AB 1533 C01 and AE 2320 CL01 both meet Mon, Tue, Thu, Fri from 9:00–9:50 AM."**: 10px, 400, line-height 17, `--color-issue-ink`.
4. Label **"Ways to fix it"** (10px, 650), 12 above.
5. **Fix list** (`div.fix-list`): 5 above, column gap 8. Full-width buttons, 238 × 36 (min-height 34), radius 9, padding 9 / 11, gap 6, centered, label 10px / 570 / line-height 12:
   - Primary **"Remove AB 1533"** — `--color-accent` fill, × icon 16 (white).
   - Secondary **"Check another term"** — bg `--color-surface`, border 1px `--color-line-button`, calendar icon 16, label `--color-ink`.

## Interactive states shown
- Save schedule disabled while nothing fits.
- AB 1533 row selected (the panel follows the selected course).
- Two fix buttons enabled.

## Data
- Engine response: `total: 0`, `diagnosis.clashingPairs` = AB 1533 and AE 2320. "Remove AB 1533" = fix `dropCourse` for AB 1533.
- The engine names courses only. The section codes (C01, CL01), the shared days ("Mon, Tue, Thu, Fri") and time ("9:00–9:50 AM") come from comparing the two sections' meetings in TypeScript.
- Time range format in the banner and issue box: "9:00–9:50 AM" (AM/PM once when both ends share it).
- "Check another term" is not an engine fix: it looks for the course in the other published terms.
