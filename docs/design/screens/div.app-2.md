# 03 · Data failed to load

- PNG: `div.app-2.png` · Figma node `30:10196` (inside `section#state-03`) · frame 1680 × 800
- Figma caption: "Data failed to load" · Static screen, no interactions.
- Shell is the same as [`div.app.md`](div.app.md). Only the differences are listed.

## What changes from state 01

### Layout
- **No details panel.** The calendar card takes the full workspace width (1416). Day columns are wider (~272 each).
- Header has no subtitle line. Its padding becomes 15.75 top / 8.75 bottom, so the title sits lower and the preferences row moves up (at y ≈ 104).

### Sidebar
- **Search box, disabled:** bg `--color-surface-disabled`, border 1px `--color-line-disabled`, same size and radius (9). Search icon at **38%** opacity. Placeholder "Course code or professor" in `--color-ink-faint`. Only 7 below it (was 20).
- **Search hint** below the box: "Search works once sections load." 9px, 400, line-height 14.4, `--color-ink-muted`, 2 side inset. The hint block is ~34 high.
- Empty text: "Your courses will appear here" / "once sections load." (two lines, same style as state 01).
- "0 selected" stays.

### Calendar
- Same 8 AM–6 PM empty grid. Caption: "No timed courses yet" · "Monday–Friday".
- **Error message card** (`div.calendar-message`), same card style as the state 01 empty message (420 max, `--color-surface-overlay`, 1px `--color-line`, radius 16, padding 28 / 20), column gap 6, centered at about 420 × 215.
  - Icon tile 42 × 42, `--color-accent-soft`, radius 12, with a **warning triangle** icon 23 × 23 (dark stroke).
  - h3 "Couldn’t load C Term sections." 17px, 700, letter-spacing −0.3, line-height 23.8, `--color-ink`. (Curly apostrophe, ends with a period.)
  - Body "Try again, or keep planning with your saved course data." 11px, 400, line-height 19.8, `--color-ink-muted`, centered.
  - Actions row (`div.message-actions`): 9 above, gap 8, centered, wraps.
    - **Primary button "Retry"**: bg + border 1px `--color-accent`, radius 9, padding 9 / 11, gap 6. Refresh icon 16 × 16 (white). Label 11px, 570, line-height 13.2, `--color-on-accent`.
    - **Warning button "Use data from Oct 9"**: bg `--color-surface`, border 1px `--color-warning-line`, radius 9, padding 9 / 11, gap 6. Clock icon 16 × 16. Label 11px, 570, `--color-ink`.

## Button styles introduced here
These two button styles are reused in later states.

| Button | Fill | Border | Text | Size |
|---|---|---|---|---|
| Primary | `--color-accent` | `--color-accent` | `--color-on-accent`, 11px / 570 | padding 9 / 11, radius 9, icon 16, gap 6 |
| Warning (secondary) | `--color-surface` | `--color-warning-line` | `--color-ink`, 11px / 570 | same |
| Disabled (state 01) | `--color-button-disabled` | same | `--color-button-disabled-ink` | same |

## Interactive states
- Search is **disabled** until data loads. The term field still works.
- Save schedule stays disabled.
- Retry reloads the term file. "Use data from Oct 9" uses the last data that loaded successfully.

## Data
- "C Term" in the heading is the selected term's name.
- "Oct 9" is the date of the cached term data (the previous `generatedAt`). Format: short month + day.
- Shown when fetching `/data/{termId}.json` fails.
