# 13 · Saved vs. Unsaved

- PNG: `div.app-12.png` · Figma node `68:4486` (inside `section#state-13` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Both save states shown side by side; the regular view begins with unsaved changes." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)) with the save states. One Figma call was made for the strip (v1 node `30:14290`).

## Scenario
Three courses, one schedule fits, AE 2320's lab CX02 is locked. The plan has **unsaved changes**.

## Header — save status
- `div.schedule-actions` wraps to two lines (285 wide, right-aligned, top at y ≈ 29):
  - Line 1: **"Unsaved changes"** (9px, 400, line-height 13, `--color-ink-muted`) · 10 gap · "Saved plans ⌄".
  - Line 2: **Save schedule** primary button (123 × 36), enabled.
- Title row: single pill "Schedule 1 of 1". Subtitle **"3 courses · 1 schedule fits"**.
- Preferences: no Sort control.

## Save-state strip (spec aid)
Same strip style as state 07 (two white cards, border 1px `--color-line-soft`, radius 10, 76 high, gap 12). Labels 9px / 650 / `--color-ink-muted`.

| Card | Status | Button |
|---|---|---|
| "Before saving" | "Unsaved changes" (9px, 400, `--color-ink-muted`) | Primary small **"Save schedule"** with bookmark icon 16 (112 × 32) |
| "After saving" | **Saved confirmation**: check-circle icon 15 + "Schedule saved" (10px, 400, line-height 14.5, `--color-saved`), gap 5 | Primary small **"Saved"** with check icon 16, fixed width 112 |

- **Small button size**: padding 7 / 9, gap 6, radius 9, label 10px / 570 / line-height 12, height 32. (Regular size is padding 9 / 11, 11px label, height 36.)
- Status sits 12 from the card's left edge; the button follows ~9 after it. Both centered ~11 below the card middle.

Rule it documents: after a save, the status becomes "Schedule saved" and the button reads "Saved" (still accent filled, check icon). It returns to "Save schedule" when something changes.

## Sidebar, calendar, details panel
- Sidebar: AE 2320 (selected, lock icon), AE 2410, AE 2210, "3 selected".
- Calendar: same blocks as state 07 (taller cards since the strip is 76 high: grid ≈ 449). CX02 block selected with lock icon.
- Details panel: AE 2320 with Lecture professor "Ye Lu" and its hint, then "Sections in this schedule": Lecture CL01 ("Only lecture", instructor block: "Ye Lu" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md))) and Lab CX02 (**"Unlock"** button), "View other lab choices".

## Interactive states
- Save schedule: enabled → after saving shows "Saved" with a check.
- "Unsaved changes" text appears whenever the plan differs from the last save.

## Data
- Saved plans are TypeScript only (browser storage). "Unsaved changes" compares the current plan (courses, chosen sections, locks, preferences) with the saved one.
