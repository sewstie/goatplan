# 01 · First visit · Empty

Fresh drafts now show Any time, no blocked times, and Only open sections on.
The PNG's 9:00 AM value is a configured state; see [the current defaults](../frames.md#new-plans).

- PNG: `div.app.png` · Figma node `30:9804` (inside `section#state-01`) · frame 1680 × 800
- Figma caption: "No courses selected; the search box is the single entry point." · Static screen, no interactions shown.
- This file also describes the **app shell** (sidebar, header, preferences row, calendar card, details panel). Other screen docs only list what changes.

Colors and type are named by the CSS variables in [`../tokens.md`](../tokens.md). Sizes are Figma px at the 1680-wide frame.

## Layout

```
div.app  1680×800  bg canvas  padding 14  gap 12  radius 22
├── Sidebar "Term and courses"   224 wide, full height (772), surface, radius 18
└── main.workspace               fills the rest (1416), column, gap 12
    ├── header.workspace-head    min-height 76
    ├── Preferences row          min-height 35
    └── div.content-grid         row, gap 12, fills remaining height (629.5)
        ├── Weekly schedule card     fills width (1134), surface, radius 18
        └── Course details panel     270 wide, surface, radius 18
```

### Sidebar (`Term and courses`)
Column, padding 22 top / 16 sides / 15 bottom. Content width 192.

1. **Brand** (`div.brand-heading`) — row, gap 9, align center, 20 below.
   - Logo: goat line drawing, 36 × 36, raster image on white (Figma asset "GoatPlan goat logo").
   - Wordmark "GoatPlan": 21px, weight 750, letter-spacing −0.9, line-height 30.45, `--color-ink`.
2. **Term field** (`div.term-field`) — 192 × 40, border 1px `--color-line`, radius 10, padding 10 / 11, space-between.
   - "C Term · Spring 2027": 12px, weight 700, line-height 17.4, `--color-ink`.
   - Chevron-down icon 12 × 12 on the right.
3. **Term description** — "All courses and sections in C Term": 9px, weight 400, line-height 13, `--color-ink-muted`. Padding 5 top, 15 bottom, 2 sides.
4. **Search box** (`div.search-box`) — 192 × 38.5 (min-height 38), border 1px `--color-line`, radius 9, padding 10.75 / 9, gap 8, 20 below.
   - Search icon 14 × 14 at 65% opacity.
   - Placeholder "Course code or professor": 10px, weight 400, line-height 14.5, `--color-ink-muted`.
5. **Section label** — 10 below.
   - "Your courses": 11px, weight 650, line-height 15.95, `--color-ink`.
   - Right-aligned count "0 selected": 9px, weight 450, line-height 13, `--color-ink-muted`.
6. **Empty text** (`p.sidebar-empty`) — two lines: "Your courses will appear here." / "Search above to get started." 11px, weight 400, line-height 18.7, `--color-ink-muted`. Padding ~7 top, 8 bottom, 2 sides.
7. **Footer** (`div.sidebar-bottom`) — pushed to the bottom of the sidebar. Border-top 1px `--color-line`, ~11 padding top.
   - "How it works · Data source" (line 1) and "Feedback" (line 2): 9px, weight 400, line-height 16.65, `--color-ink-muted`. These are three separate links.
   - In code, only "Data source" is shown for now. "How it works" and "Feedback" come back in step B10, when they have pages to link to.

### Header (`header.workspace-head`)
Row, space-between, align center. Padding 8 top, 4 sides, 1 bottom. Min-height 76.

- **Left** (`div.heading-left`) — column, gap 7.
  - Breadcrumbs, row gap 7: "Spring 2027" (10px, 400, `--color-ink-muted`) · chevron-right icon 10 × 10 · "C Term" (10px, 550, `--color-ink`). Line-height 14.5.
  - Title line (row, wraps, gap 16): h1 "Schedule planner" 25px, weight 700, letter-spacing −0.9, line-height 30, `--color-ink`. In planner states the schedule switcher sits in this row.
  - Subtitle "Add courses to start planning your term.": 10px, 400, line-height 14.5, `--color-ink-muted`.
- **Right** (`div.schedule-actions`) — row, gap 10, max-width 285.
  - "Saved plans" + chevron-down 10 × 10, gap 5: 10px, 400, `--color-ink-soft`. A menu trigger.
  - **Save schedule button, disabled** (`span.control`): 123 × 36, bg `--color-button-disabled`, border 1px same color, radius 9, padding 9 / 11, gap 6. Bookmark icon 16 × 16 at 45% opacity. Label "Save schedule" 11px, weight 570, line-height 13.2, `--color-button-disabled-ink`, centered.

### Preferences row
Row, wraps, gap 7, align center, padding 1.5 / 2, min-height 35.

- Label "Preferences": 9px, weight 600, `--color-ink-muted`.
- **Start-time pill** (`span.preference`): bg `--color-surface`, radius 24, min-height 32, padding 8.75 / 10, gap 6. "Starts after" (9px, 400, `--color-ink-muted`) + "9:00 AM" (10px, 650, `--color-ink`) + chevron-down 10 × 10 (2 left margin). Opens a time picker.
- **Block a time** (`span.block-add`): border 1px **dashed** `--color-line-strong`, radius 24, padding 7.5 / 10, gap 5, no fill. Plus icon 11 × 11 + "Block a time" 9px, 400, `--color-ink`.
- **Only open sections toggle** (`span.toggle-label`, 3 left margin): row gap 7.
  - Track 29 × 17, radius 20, padding 2, `--color-accent` when on; knob 13 × 13 `--color-surface`, radius 6.5, pushed right, with a check icon 9 × 9 (accent color).
  - Label "Only open sections": 9px, 400, `--color-ink`.
  - Shown **on** in every frame.

### Weekly schedule card
Surface, radius 18. Three layers:

- **Day header** (`div.calendar-days`): 47 high, 3 above. CSS grid: `47px` time-axis column + 5 equal columns, 8 right padding. Each day cell has a 1px `--color-line` left border; label centered, 10px, weight 620, line-height 14.5, `--color-ink`. Days: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday".
- **Body** (`div.calendar-body`): from y = 50 to 24 above the card bottom; padding 9 top, 8 right, 8 bottom.
  - Time axis 47 wide. Labels "8 AM" … "6 PM" (one per hour): 8.5px, 400, line-height 12.33, `--color-ink-muted`, right-aligned ~7 from the axis edge, vertically centered on their hour line.
  - Five day columns, each with a 1px `--color-line` left border.
  - Hour lines: 1px `--color-line` top border across the 5 columns, evenly spaced. 8 AM–6 PM = 10 hours over 538.4 → **53.84 px per hour**.
- **Caption** (`div.calendar-caption`): along the bottom, padding 3 top, 10 bottom, 47 left, 12 right, space-between. Both 8px, 400, line-height 11.6, `--color-ink-muted`.
  - Left: "No timed courses yet" (changes per state, e.g. "Auto-fit · 8:30 AM–4:30 PM").
  - Right: "Monday–Friday".
- **Empty message** (`div.calendar-message`), only in this state: card centered over the grid (at 420 × 184), max-width 420, bg `--color-surface-overlay`, border 1px `--color-line`, radius 16, padding 28 / 20, column, centered, gap 5.9.
  - Icon tile 42 × 42, `--color-accent-soft`, radius 12, with an open-book icon 23 × 23 (accent stroke).
  - h3 "Add your first course": 17px, 700, letter-spacing −0.3, line-height 23.8, `--color-ink`. ~7 above.
  - Body, line-height 19.8, 11px, centered: "Search by course code or professor in the sidebar." (400, `--color-ink-muted`), new line "Try CS 2102" (600, `--color-ink`).

### Course details panel — "info" variant
Padding 20 / 16, column. Used when no course is selected.

- Info-circle icon 23 × 23 (`--color-ink`).
- h2 "Your term starts here": 19px, 700, letter-spacing −0.55, line-height 24.7, `--color-ink`. 15 above.
- Paragraph "Pick courses first. GoatPlan finds the sections that fit.": 11px, 400, line-height 20.35, `--color-ink-muted`. 10 above, 24 below.
- Three step rows (`div.step-row`): border-top 1px `--color-line`, padding 13 vertical, gap 11, 44 high.
  - Number "01" / "02" / "03": 10px, 650, line-height 17, `--color-accent`, column ~21 wide.
  - Text: "Choose your term." / "Search for a course or professor." / "Compare schedules and save a plan." 10px, 400, line-height 17, `--color-ink-secondary`.

## Icons used
All are SVG line icons in Figma, except the logo (a raster image).

| Where | Icon | Size | Note |
|---|---|---|---|
| Term field | chevron down | 12 | |
| Search box | magnifier | 14 | 65% opacity |
| Breadcrumbs | chevron right | 10 | |
| Saved plans | chevron down | 10 | |
| Save schedule | bookmark | 16 | 45% opacity while disabled |
| Start-time pill | chevron down | 10 | |
| Block a time | plus | 11 | |
| Toggle knob | check | 9 | accent |
| Empty message | open book | 23 | accent, on accent-soft tile |
| Details panel | info circle | 23 | |

## Interactive states shown
- Save schedule: **disabled** (nothing to save yet).
- Only open sections: **on**.
- Search box: empty, not focused.
- Everything else is at rest. The design shows no hover or focus styles here.

## Data
- Term: id `2027-C`, shown as "C Term · Spring 2027" (term `name` · `season` `year`) in the term field, "Spring 2027 > C Term" in the breadcrumbs, and "All courses and sections in C Term" below the field.
- "0 selected": number of courses in the plan.
- Calendar range is 8 AM–6 PM, Mon–Fri, when there are no courses. With courses it auto-fits (see `div.app-6.md`).
- "Try CS 2102" is a fixed suggestion.
- No engine call is needed in this state.
