# 02 · Loading term data

- PNG: `div.app-1.png` · Figma node `30:9999` (inside `section#state-02`) · frame 1680 × 800
- Figma caption: "Static gray placeholders while C Term sections load." · Static screen, no interactions.
- Shell is the same as [`div.app.md`](div.app.md). Only the differences are listed.

## What changes from state 01

### Sidebar
- The empty text is replaced by `div.course-list`: three **skeleton course cards** (gap 5, each with 12 below).
  - Card: 192 wide, ~97 high, bg `--color-surface-subtle`, radius 10, padding 23 / 10, column gap 10.
  - Three bars inside, all `--color-skeleton`, radius 5: 158 × 12, 129 × 10, 83 × 10.
- "0 selected" stays.

### Header
- A skeleton bar sits next to the title, where the schedule switcher goes: 130 × 26, `--color-skeleton`, radius 5 (title row gap 16).
- Subtitle text: **"Loading C Term sections…"** (uses the ellipsis character).
- Save schedule is still disabled.

### Calendar
- Same 8 AM–6 PM grid, Monday–Friday.
- Each day column holds two **loading blocks**: `--color-skeleton-block`, radius 7, inset 4 from the column sides. Positions (as % of grid height):

| Day | Block 1 | Block 2 |
|---|---|---|
| Mon, Wed, Fri | 10%–18.3% (9:00–9:50) | 30%–38.3% (11:00–11:50) |
| Tue, Thu | 20%–28.3% (10:00–10:50) | 60%–78.3% (2:00–3:50) |

  These are placeholders only; they don't come from data.
- No empty-message card.
- Caption left: **"Awaiting term data"**. Right: "Monday–Friday".

### Details panel
Replaced by skeletons. Padding 30 top / 16 sides, column gap 15.
- Bar 131 × 22, then bar 219 × 10 (`--color-skeleton`, radius 5).
- Three **skeleton choice cards**: border 1px `--color-line`, radius 10, padding 30 top / 25 bottom / 10 sides, column gap 10. Bars 199 × 10, 162 × 10, 104 × 10.

## Interactive states
- Everything is static while loading. The term field, search box and preferences look normal (not disabled) in the design.

## Data
- Shown while `/data/2027-C.json` is being fetched.
- The term name in the subtitle ("C Term") comes from the term chosen in the term field.
