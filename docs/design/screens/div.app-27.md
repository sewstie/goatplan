# 28 · Saved professor · No longer available

- PNG: `div.app-27.png` · Figma node `68:10736` (inside `section#state-28` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 03 · Retain the unavailable name outside the normal options; offer an explicit Clear action. Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- Same layout as state 27 ([`div.app-26.md`](div.app-26.md)). Only the differences are listed. This file is the reference for the **unavailable professor select**.

## Scenario
A restored plan chose lecture professor **Ada Morgan**, who no longer teaches any lecture in C Term. Nothing fits. The name stays visible until the student clears it.

## Sidebar
- DEMO 1001 row with lock icon, sub **"No eligible lecture · B01 · D01"**.

## Header
- Warning pill "0 schedules fit". Subtitle **"Restored plan · Your choices are preserved"**. Save disabled.
- Preferences as in state 27 (9:00 AM, Work Tue/Fri, Only open sections on).

## Calendar
Same empty grid, "No matching schedule" caption and "No matching timetable" message card as state 27.

## Details panel
1. Kicker **"Restored plan needs attention"** (`--color-attention`).
2. h2 "DEMO 1001", title "Engineering Seminar".
3. Lecture professor ("Optional") with the **unavailable select**:
   - 252 × 38, bg `--color-unavailable-surface`, border 1px `--color-unavailable-line`, radius 8, padding 11 / 9 / 9, row gap 6.
   - Value **"Ada Morgan"** (10px, 400, `--color-ink`), then a warning badge **"Unavailable"** pushed to the right (bg `--color-warning-soft`, text `--color-warning`, 7px, 570, line-height 9.8, padding 3 / 6, radius 5), then chevron-down 11.
   - Hint as in state 24.
4. **Issue box**, no icon: h3 **"Ada Morgan has no eligible lecture."** · body **"This saved professor choice is still applied in C Term. Clear it to include the current lecture instructors."**
5. **Retained constraints** (padding 13 top and bottom, gap 9):
   - Badge **"Lab B01 locked"**: bg `--color-accent-soft`, text `--color-accent`, 9px, 570, line-height 12.6, padding 3 / 6, radius 5.
   - **"Starts after 9 AM · Work blocked"** (10px, 400, line-height 17, `--color-ink-muted`).
6. Primary full-width button **"Clear unavailable professor"** with × icon 16.
7. Quiet note **"Other locks and preferences stay as they are."** (10px, line-height 17.5, `--color-ink-muted`, 12 above).
- No section cards in this frame.

## Interactive states
- The unavailable name is shown in the select but is not one of its normal options. Opening the select shows Any professor and the current lecture instructors.
- "Clear unavailable professor" sets the professor to Any professor and keeps locks and preferences.

## Data
- On restore, compare the saved professor with the current lecture instructors. No match → this state; keep the saved value until the student changes it.
- Summary line: the retained start time and blocked-time names.
