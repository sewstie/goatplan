# 07 · One schedule / Many schedules (regular planner)

- PNG: `div.app-6.png` · Figma node `68:1725` (inside `section#state-07` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Regular planner anatomy with both switcher variants. The 24-combination count is illustrative." · Static screen, no interactions.
- Shell: [`div.app.md`](div.app.md). Planner parts: [`div.app-3.md`](div.app-3.md). Course colors: [`div.app-4.md`](div.app-4.md).
- This is the **regular planner**. Most later states start from it.

## Scenario
Three courses (AE 2320, AE 2410, AE 2210), 24 schedules fit, schedule 3 is shown. Nothing is locked. AE 2320 is the selected course.

## Layout

```
main.workspace (column, gap 12)
├── header                 title row: "Schedule planner" + switcher
├── Preferences row        … + Sort control pushed to the far right
├── div.variant-strip      1416 × 69   ← spec strip, see below
└── div.content-grid       calendar (1120) + details panel (284), 546 high
```

## Sidebar
- Search box: placeholder (no search).
- "Your courses" · "3 selected". List gap 5:
  - AE 2320 — **selected** row (fill `--color-surface-selected`), swatch `--color-course-1`, "Introduction to Orbital Mechanics", "CL01 · Lab CX02". No lock icon.
  - AE 2410 — unselected, swatch `--color-course-2-swatch`, "Introduction to Aerospace Structures", "C01".
  - AE 2210 — unselected, swatch `--color-course-3-swatch`, "Introduction to Thermal Engineering", "C01".

## Header
- Switcher with arrows: ‹ **"Schedule 3 of 24"** ›.
- Subtitle **"3 courses · 24 schedules fit"**.
- Save schedule: enabled (primary).

## Preferences row
Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM (×) · Block a time · Only open sections (on) · **Sort** (right-aligned).

- **Sort control** (`span.sort`): bg `--color-surface`, radius 8, padding 7.5 / 9, gap 6, min-width 146. "Sort" (9px, 400, `--color-ink-muted`) + "Fewest early classes" (9px, 400, `--color-ink`) + chevron-down 10. Opens a menu of sort orders.

## Variant strip (spec aid)
Two white cards side by side (gap 12), each 69 high, border 1px `--color-line-soft`, radius 10, content 12 from the left. It shows both switcher variants with a label and a caption. Read it as a spec of the switcher, **not** as product UI.

| Card | Label | Switcher | Caption |
|---|---|---|---|
| Left | "One schedule" | count pill only: "Schedule 1 of 1" | "1 schedule fits · arrows hidden" |
| Right | "Many schedules" | ‹ "Schedule 3 of 24" › | "24 schedules fit · browse alternatives" |

- Label: 9px, 650, `--color-ink-muted`. Caption: 9px, 400, `--color-ink-muted`.
- Switcher here is the small size: pill padding 4 / 7, text 11px / 650 / line-height 15.95; arrows 22 × 24. The header uses the regular size (27 × 29 arrows, 12px text).

Rule it documents: **hide the arrows when only one schedule fits.**

## Calendar
- Range 8:30 AM–4:30 PM, caption "Auto-fit · 8:30 AM–4:30 PM", early band and Work blocks as in state 05.
- The card is shorter (546), so the grid is 454 high → **~56.75 px per hour**, and blocks use the **compact** layout:

| Part | Regular (≈67 px/hour, states 04–05) | Compact (≈57 px/hour, this state) |
|---|---|---|
| Block padding | 6 / 7 | 3 / 5 |
| Gap between lines | 3 | 2 |
| Course code | 10px / 700 / lh 13 | 9px / 700 / lh 10.8 |
| Section code | 8px / 400 / lh 10.4 | 8px / 400 / lh 9.6 |
| Time | 8px / 400 / lh 10.4 | 7.5px / 400 / lh 9 |
| Room (85% opacity) | 7.5px / lh 9.75 | 7px / lh 8.4 |

- Blocks (same as state 05): AE 2320 CL01 Mon–Fri 9:00–9:50 (dark), AE 2410 C01 Mon–Fri 10:00–10:50 (peach), AE 2210 C01 Mon–Fri 11:00–11:50 (yellow), AE 2320 CX02 Thu 3:00–3:50 PM (**selected** style, no lock).

## Details panel (AE 2320)
Same as state 04: Lecture professor **"Ye Lu"** with its hint → "Sections in this schedule" → Lecture CL01 ("Only lecture" badge, instructor block: "Ye Lu" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md))) and Lab CX02 (**"Lock"** button) → "View other lab choices".

## Interactive states shown
- Switcher: both variants (see strip). In the header, both arrows are enabled.
- Sort menu: closed, value "Fewest early classes".
- AE 2320 row selected; CX02 block selected.

## Data
- "Schedule 3 of 24": position in the engine's `schedules` list and the count shown as "schedules fit".
- Sort options map to engine `sort` weights. "Fewest early classes" weights early minutes most. Other options aren't in the design.
- Blocks come from the shown schedule's `courses[].sections`.
