# 25 · Lecture professor · Picker open

- PNG: `div.app-24.png` · Figma node `68:9747` (inside `section#state-25` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 02 · Lecture instructors only; lab-only and discussion-only teachers are absent. Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- Same as state 24 ([`div.app-23.md`](div.app-23.md)). Only the differences are listed. This file is the reference for the **professor options list**.

## Scenario
DEMO 1001 with four schedules. The lab B01 is locked. The student opened the Lecture professor select.

## Differences from state 24
- Calendar: the B01 block shows a lock icon 10 before the code.
- Lab B01 card: small accent button **"Unlock"** instead of the "Compatible" badge. Discussion D01 keeps "Compatible".
- The sidebar row has no lock icon in this frame (state 26 has one). Treat the missing icon as a design slip.

## Professor options list (`Lecture professor options`)
Opens below the select, over the cards (55 below the top of the filter block, so it starts right under the select).
- 252 × 210, bg `--color-surface`, border 1px `--color-listbox-line`, radius 11, padding 5, shadow `--shadow-listbox`.
- Four options, 240 wide, ~49 high, radius 7, padding 10 / 9 (9 top on unselected rows). Each has a name (10px, 700, line-height 14.5) and a line under it (8px, 400, line-height 12.8, `--color-ink-muted`), gap ~2.5:

| Option | Second line | State |
|---|---|---|
| **Any professor** | "All 4 lecture times" | selected: bg `--color-accent-soft`, name `--color-accent`, check icon 13 at the right |
| **Alex Rivera** | "3 lecture times · includes co-teaching" | rest, name `--color-ink` |
| **Jordan Kim** | "1 co-taught lecture" | rest |
| **Morgan Lee** | "1 lecture time" | rest |

- Only lecture instructors are listed. Sam Patel (lab) and Riley Chen (discussion) are not.

## Interactive states
- Select: **open**, Any professor selected.
- Use a real listbox: arrow keys move, Enter or Space picks, Escape closes and returns focus to the select. The options list must not be clipped by the panel (render it above the panel content).

## Data
- Options: Any professor, then each distinct lecture instructor, co-teachers included.
- Second line: "All {n} lecture times" for Any professor; "{n} lecture time(s)" per instructor; add " · includes co-teaching" when some of those lectures are co-taught; "{n} co-taught lecture" when all of them are.
