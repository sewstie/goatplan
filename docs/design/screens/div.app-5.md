# 06 · Course not offered this term

- PNG: `div.app-5.png` · Figma node `30:11265` (inside `section#state-06`) · frame 1680 × 800
- Figma caption: "AE 2320 is listed in C Term; show a clear path back from D Term." · Static screen, no interactions.
- Shell: [`div.app.md`](div.app.md). Message card: [`div.app-4.md`](div.app-4.md). Primary button: [`div.app-2.md`](div.app-2.md). Only the differences are listed.
- No Figma call was made for this frame: every part reuses styles from those states. Sizes below come from the Figma layer data.

## Scenario
The student switched to **D Term**, has no courses, and searched "AE 2320", which only runs in C Term.

## Sidebar
- Term field: **"D Term · Spring 2027"**. Description: **"All courses and sections in D Term"**.
- Search box value: "AE 2320" (`--color-ink`).
- **Not-offered card** (same `div.search-message` card as state 05: border 1px `--color-line`, radius 10, padding 12–13 / 12 / 24): 192 × 131, 20 below.
  - h3 "AE 2320 isn’t offered in D Term." — 12px, 700, line-height 19.2, `--color-ink`, wraps to two lines.
  - "It runs in C Term." — 10px, 400, line-height 16.5, `--color-ink-muted`.
  - **Primary button "Switch to C Term"**, 12 above: 125 × 32 (smaller than the 36-high header button), radius 9, `--color-accent` fill, circular-arrow icon 16 (white), label `--color-on-accent`, ~10px, 570.
- Your courses: "0 selected" and the state 01 empty text ("Your courses will appear here." / "Search above to get started.").

## Header
- Breadcrumbs: "Spring 2027 > **D Term**".
- Subtitle: **"Choose courses offered in D Term."**
- Save schedule: disabled.

## Calendar
- Empty 8 AM–6 PM grid, caption "No timed courses yet" · "Monday–Friday".
- Empty message card (same as state 01, open-book icon):
  - h3 **"Plan your D Term"**
  - Body (one muted paragraph, two lines, centered): **"Search for a course offered this term, or switch to C Term for AE 2320."** No bold suggestion line.

## Details panel — info variant
Same layout as state 01 (info icon, h2, paragraph, numbered rows), but only **two** rows:
- h2 **"Term-specific courses"**
- Paragraph **"Changing the term updates which courses and sections are available."**
- 01 — **"AE 2320 · C Term"**
- 02 — **"D Term · March 15–May 5, 2027"**

## Interactive states
- "Switch to C Term" changes the term field to C Term and keeps the search text.
- Save schedule: disabled.

## Data
- Search runs over the D Term file and finds nothing for "AE 2320". To show this message, GoatPlan also has to know the code exists in another published term (look it up in the other term files listed in `/data/index.json`).
- "It runs in C Term." names the term(s) where the course exists.
- Row 02 shows the current term's `start`–`end` dates: "March 15–May 5, 2027" (full month name, no weekday, year once at the end).
