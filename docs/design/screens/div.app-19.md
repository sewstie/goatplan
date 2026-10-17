# 20 · Hover / Selected block

- PNG: `div.app-19.png` · Figma node `30:17289` (inside `section#state-20`) · frame 1680 × 800
- Figma caption: "A hovered Tuesday lecture and an indigo-selected Thursday lab with its panel open." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). Two Figma calls: the tooltip (node `30:17649`) and the hovered block (node `30:17506`). This file is the reference for **block hover**, **block selected** and the **tooltip**.

## Scenario
Three courses, one schedule. The pointer is over AE 2410's Tuesday block. AE 2320's lab CX02 (Thursday) is selected, and its course is open in the panel. CX02 is locked.

## Sidebar, header, preferences
- "3 selected": AE 2320 (selected row, lock icon), AE 2410, AE 2210.
- "Schedule 1 of 1", "3 courses · 1 schedule fits", Save enabled. Preferences without Sort.

## Calendar — block states

| State | Fill | Border | Shadow | Example |
|---|---|---|---|---|
| Rest | course color | 1px transparent | none | AE 2410 Mon |
| **Hover** | course color | 1px `--color-course-2-hover-line` (a darker shade of the course color) | `--shadow-block-hover` (0 2px 5px rgba(76,51,35,0.07)) | AE 2410 **Tue** |
| **Selected** | `--color-surface-raised` | 1px `--color-accent` | `0 0 0 0.5px var(--color-accent)` ring | AE 2320 CX02 Thu |

- Hover keeps the regular block layout (padding 6 / 7, code 10px, section 8px, time 8px, room 7.5px at 85%).
- The design only defines a hover border for the peach course. For other courses, use a darker shade of that course's color the same way (see tokens.md).

## Tooltip (`div.hover-tooltip`)
Shown under the hovered block, overlapping the next block (top-left ~8px left of the block's left edge, ~24px below its bottom).
- 220 × 128, bg `--color-surface`, border 1px `--color-line-popover`, radius 10, padding 12 / 14, column gap 2.8, shadow `--shadow-popover` (0 4px 7px rgba(36,41,65,0.09)).
- Content:
  1. Kicker **"Hovered block"**: 9px, 650, line-height 13, `--color-ink-muted`, ~7 below. (Design label; in the app this line can be left out or used as a visually hidden heading.)
  2. **"AE 2410 · C01"**: 11px, 700, line-height 15.95, `--color-ink`.
  3. **"Introduction to Aerospace Structures"**: 10px, 400, line-height 15, `--color-ink`, ~3 above / 5 below.
  4. **"Tue · 10:00–10:50 AM"**: 9px, 400, line-height 15.3, `--color-ink-muted`.
  5. **"Higgins Labs 116 · Mark Richman"**: same style.

## Details panel
- New neutral kicker **"Selected course"** above the h2 (9px, 650, `--color-ink-muted`; same position as "Needs attention").
- h2 "AE 2320", title "Introduction to Orbital Mechanics", "Your choices": Lecture CL01 ("Only lecture") and Lab CX02 ("Unlock"), "View other lab choices", Professor "Ye Lu", "Rate My Professors".

## Interaction notes
- Hover and keyboard focus should both show the tooltip (focus on a block = same as hover). Escape closes it.
- Clicking a block selects it: indigo style + its course opens in the panel.
- Tooltip time format: "Tue · 10:00–10:50 AM" (short day, AM/PM once).

## Build note: render calendar tooltips in a portal
The calendar card clips its content (`overflow: hidden` on the "Weekly schedule" section in `AppShell`). A tooltip drawn inside it gets cut off near the card's edges, e.g. under a late-afternoon block. So **calendar tooltips must render in a portal, outside the calendar's clipping container** (e.g. into `document.body`), placed against the block's position on screen. The current `components/ui/Tooltip` renders in place, so it needs a portal option before the calendar uses it (step B5).
