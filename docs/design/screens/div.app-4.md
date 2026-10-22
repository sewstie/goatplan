# 05 · Search · No results

- PNG: `div.app-4.png` · Figma node `68:1033` (inside `section#state-05` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "A helpful code example and professor-name suggestion." · Static screen, no interactions.
- Shell: [`div.app.md`](div.app.md). Planner parts: [`div.app-3.md`](div.app-3.md). Only the differences are listed.

## Scenario
Three courses in the plan (AE 2320, AE 2410, AE 2210), exactly one schedule fits, AE 2320's lab CX02 is **locked**. The student typed "AE 23200" (a typo) and nothing matches.

## Sidebar
- **Search box with a value**: same box; the text "AE 23200" is 10px, 400, `--color-ink` (the placeholder was `--color-ink-muted`). Icon still at 65%.
- **No-results card** (`div.search-message`), 20 below: 192 wide, border 1px `--color-line`, radius 10, padding 12 top / 12 sides / 24 bottom, column gap 5.
  - h3 "No course matches ‘AE 23200’." — 12px, 700, line-height 19.2, `--color-ink`. Curly single quotes around the typed text, period at the end. Wraps.
  - "Try a code like AE 2320 or a professor’s name." — 10px, 400, line-height 16.5, `--color-ink-muted`.
- No "Search results" label when there are no results.
- **Your courses** "3 selected", list (`div.course-list`) gap 5:
  - **AE 2320** — selected row (filled `--color-surface-selected`), swatch `--color-course-1`. A **lock icon** 11 × 11 sits ~4 after the code, showing a locked section. Sub "CL01 · Lab CX02".
  - **AE 2410** — unselected row (no fill, transparent border, same padding 12 / 10, radius 10). Swatch `--color-course-2-swatch`. Title "Introduction to Aerospace Structures". Sub "C01".
  - **AE 2210** — unselected. Swatch `--color-course-3-swatch`. Title "Introduction to Thermal Engineering". Sub "C01".

## Header
- **Single-schedule switcher**: only the count pill "Schedule 1 of 1" — no arrows when there is one schedule.
- Subtitle: **"3 courses · 1 schedule fits"** (singular "schedule fits").
- Save schedule: enabled (primary).

## Preferences
Same as state 04: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM (×) · Block a time · Only open sections (on).

## Calendar
Range 8:30 AM–4:30 PM, caption "Auto-fit · 8:30 AM–4:30 PM". Early band "No classes before 9:00 AM". Work blocked Tue and Fri 2–4 PM. Blocks now use a 3px inset on both sides.

| Course | Section | Days | Time | Room | Block fill | Text |
|---|---|---|---|---|---|---|
| AE 2320 | CL01 | Mon–Fri | 9:00 AM–9:50 AM | Unity Hall 400 | `--color-course-1` | `--color-on-accent` |
| AE 2410 | C01 | Mon–Fri | 10:00 AM–10:50 AM | Higgins Labs 116 | `--color-course-2` | `--color-ink` |
| AE 2210 | C01 | Mon–Fri | 11:00 AM–11:50 AM | Salisbury Labs 104 | `--color-course-3` | `--color-ink` |
| AE 2320 | CX02 | Thu | 3:00 PM–3:50 PM | Higgins Labs 230 | selected style (see 04) | `--color-ink` |

- **Locked block**: the CX02 block shows a **lock icon 10 × 10** before "AE 2320" in its title row (gap 4).

## Details panel (AE 2320)
Same as state 04, except the Lab CX02 card shows the small accent button **"Unlock"** (lock icon 11 + label, 59 × 21) instead of "Lock".

## Course colors introduced
Each course gets a color pair: a pale block fill and a stronger swatch. Text on pale fills is `--color-ink`.

| Slot | Block fill | Swatch | Used by |
|---|---|---|---|
| 1 | `--color-course-1` | `--color-course-1` | AE 2320 (dark slot, white text) |
| 2 | `--color-course-2` | `--color-course-2-swatch` | AE 2410 (peach) |
| 3 | `--color-course-3` | `--color-course-3-swatch` | AE 2210 (yellow) |

## Interactive states shown
- Search box: has a value (no focus ring shown).
- AE 2320 row: selected. Others: rest.
- Lab CX02: locked (lock icon on row, block and an Unlock button).
- Switcher: single schedule, no arrows.

## Data
- Search returns no match for the typed text. The message repeats the query exactly as typed.
- "Schedule 1 of 1" and "1 schedule fits": the engine returned one schedule.
- Locked section = `preferences.locked["AE 2320"] = ["AE 2320-CX02"]` in the engine request.
