# 21 · Previewing an alternative

- PNG: `div.app-20.png` · Figma node `68:8149` (inside `section#state-21` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "CX03 appears as a dashed ghost; the current CX02 selection stays in place." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). Alternative rows were introduced in [`div.app-16.md`](div.app-16.md). One Figma call (full frame).

## Scenario
Three courses, one schedule. AE 2320 is selected, lab CX02 is chosen and locked. The student is previewing lab **CX03** (pointer or keyboard focus on its row) before switching.

## Sidebar, header, preferences
- "3 selected": AE 2320 (selected, lock icon), AE 2410, AE 2210.
- "Schedule 1 of 1", "3 courses · 1 schedule fits", Save enabled. Preferences without Sort.

## Calendar
- Range grows to **8:30 AM–5:30 PM** to fit the preview (labels end "5 PM", "5:30 PM"). Caption **"Auto-fit · 8:30 AM–5:30 PM"**.
- Compact blocks. AE 2320 CX02 Thu 3:00–3:50 PM stays in place (selected style, lock icon).
- **Ghost preview block**: AE 2320 **CX03**, Thursday 4:00–4:50 PM.
  - bg `--color-preview-surface`, border **1px dashed** `--color-accent`, radius 6, padding 3 / 5, gap 2.
  - All text `--color-accent`: "AE 2320" (9px / 700) + "CX03" (8px), time **"Preview · 4:00 PM–4:50 PM"** (7.5px), room "Higgins Labs 230" (7px, 85%).

## Details panel (AE 2320)
The panel is denser here so the alternatives fit (padding 19 top / 16 sides / ~24 bottom).

1. h2 "AE 2320", title "Introduction to Orbital Mechanics".
2. **Lecture professor** "Ye Lu" with its hint (as in [`div.app-3.md`](div.app-3.md)).
3. Label "Sections in this schedule" (7 above instead of 11).
4. **Compact section cards**: padding 13 top / 8 sides / 8 bottom, column gap 6 (regular cards use 15 / 10 / 10 and gap 8).
   - Lecture CL01 ("Only lecture") with the instructor block "Ye Lu" · "— / 5" · "Rating unavailable" · "Rate My Professors". The block's top padding is 7.
   - Lab CX02 ("Unlock") · "Thu · 3:00 PM–3:50 PM" · "Higgins Labs 230" · "4 of 40 seats open" · "Ye Lu".
5. Label **"Other lab choices"** (10px, 650; 7 above, 5 below). It replaces "View other lab choices" while the list is open.
6. Two **alternative rows** (252 wide, border 1px `--color-line`, radius 8, padding 8 / 7, row gap 7, centered). The current lab CX02 is no longer repeated in this list, and the rows have no radio marker in v2:

| Row | State | Fill | Border | Right side |
|---|---|---|---|---|
| **CX01** · "Thu · 2:00 PM–2:50 PM" | rest | none | 1px `--color-line` | "1 open" (8px, `--color-ink-muted`) |
| **CX03** · "Thu · 4:00 PM–4:50 PM" | **previewing** | `--color-choice-preview` | **1px dashed** `--color-accent` (padding-top 11) | badge **"Previewing"** |

  - Section code 10px / 650 / line-height 14.5, `--color-ink`; meeting 8px / 400 / line-height 11.6, `--color-ink-muted`.
  - "Previewing" badge: bg `--color-accent-soft`, text `--color-accent`, 8px / 570 / line-height 11.2, padding 2 / 6, radius 5.

## Interaction notes
- Hover or focus on an alternative row → draw its ghost block and mark the row "Previewing". Leaving the row removes the ghost. The current choice doesn't move.
- Selecting the row (click, Enter or Space) switches the lab. Rows behave as a radio group (arrow keys move between them).
- The calendar range may grow during the preview to fit the ghost.

## Data
- Alternatives: other lab sections of the course from the term file, with open seats. Previewing doesn't call the engine; switching does (new request with the chosen section locked).
