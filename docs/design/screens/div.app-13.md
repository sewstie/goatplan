# 14 · Online / No set time

- PNG: `div.app-13.png` · Figma node `30:14648` (inside `section#state-14`) · frame 1680 × 800
- Figma caption: "An illustrative asynchronous elective stays below the grid rather than occupying a time slot." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). One Figma call was made for the strip (node `30:14801`).

## Scenario
Four courses; one is an online, asynchronous elective with no meeting time (illustrative). One schedule fits. The elective is selected.

## Sidebar
- "4 selected": AE 2320 (lock icon), AE 2410, AE 2210, **Online elective (selected)**.
- Online elective row (78.9 high, no title wrap): swatch `--color-course-4-swatch`, code **"Online elective"**, title **"Independent study"**, sub **"ON01 · No set time"**.

## Header
- Single pill "Schedule 1 of 1". Subtitle **"4 courses · 1 schedule fits · 1 course has no set time"**. Save enabled.
- Preferences: no Sort control, no variant strip.

## Calendar
- Grid is shorter (body 456.6 high) to make room for the strip. Range 8:30 AM–4:30 PM. Blocks as in state 07 (CX02 selected, lock icon).
- **No set time strip** (`div.no-time-strip`) at the bottom of the calendar card, above the caption: full width, border-top 1px `--color-line`, padding 13.5 top / 13 right / 9 bottom / **47 left** (lines up with the day columns), column gap 9.35.
  - Heading **"No set time"**: 10px, 700, line-height 14.5, `--color-ink`.
  - **Untimed item** (`div.untimed-item`): full width (1074 × 48.5), bg `--color-course-4-soft`, radius 8, padding 9 / 10, row gap 8, centered.
    - Swatch 8 × 8, radius 3, `--color-course-4-swatch`.
    - Text column (gap 2.5): **"Online elective · ON01"** (10px, 700, line-height 14.5, `--color-ink`) / **"Independent study · Online, asynchronous"** (9px, 400, line-height 13, `--color-ink-muted`).
    - Right-aligned **neutral badge "No set time"** (bg `--color-neutral-soft`, text `--color-neutral-ink`, 8px / 570 / line-height 11.2, padding 2 / 6, radius 5).
- Caption unchanged: "Auto-fit · 8:30 AM–4:30 PM" · "Monday–Friday".

## Details panel (Online elective)
- h2 **"Online elective"**, title **"Independent study"**, label "Your choices".
- Section choice card: heading **"ON01"** + neutral badge **"No set time"**. Meta rows:
  - clock — **"No scheduled meeting time"**
  - map pin — **"Online · asynchronous"**
  - people — **"12 of 30 seats open"**
  - graduation cap — **"Instructor not assigned yet"**
- **Quiet note** below the card (238 × 47): **"This section appears in the No set time strip. It does not block calendar time."** ~10px, 400, line-height ~17, `--color-ink-muted`.
- No professor select and no "Rate My Professors" (no instructor).

## Data
- A section with no `meetings` (or none with times) goes to the strip, not the grid.
- "Online · asynchronous" comes from `delivery`.
- The engine reports such courses with `optionsInData: 0` only when they have no options at all; check how the engine treats sections without times before relying on it.
