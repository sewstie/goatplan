# 04 · Search results · Fit before adding

- PNG: `div.app-3.png` · Figma node `68:595` (inside `section#state-04` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Fit, clash, and full badges. The full-section result is an illustrative availability change." · Static screen, no interactions.
- Shell: [`div.app.md`](div.app.md). This file is the reference for the **planner parts**: search results, course rows, schedule switcher, enabled Save, blocked-time pill, calendar blocks, blocked time, early band and the course details panel. Later docs point here.

## Scenario
AE 2320 is already in the plan (1 course, 3 schedules fit, showing schedule 1). The student has typed a search (the box still shows the placeholder in Figma) and sees three results, each with a fit badge. A "Work" block is set for Tue and Fri 2–4 PM.

## Sidebar

Order: brand · term field · term description · search box · **Search results** · **Your courses** · footer.

### Search results
- Section label row (bottom-aligned, space-between): "Search results" (11px, 650, `--color-ink`) and "3 courses" (9px, 450, `--color-ink-muted`). Row is ~26 high.
- List (`div.search-results`): column, gap 5, 12 below the list.
- **Result card** (`div.search-result`): 192 wide, border 1px `--color-line`, radius 9, padding 9, column gap 4. Height 105 (119 when the title wraps to two lines).
  1. Heading row, space-between, centered: course code (11px, 700, line-height 15.95, `--color-ink`) and an **Add button**.
  2. Title: 10px, 400, line-height 14.5, `--color-ink`. Wraps.
  3. Meta: "1 lecture · David Olinger" — 9px, 400, line-height 13.5, `--color-ink-muted`.
  4. Badge row, 5 above.
- **Add button** (small accent button, `span.control`): 46.6 × 21, bg `--color-accent-soft`, transparent 1px border, radius 5. Plus icon 11 + "Add" (9px, 570, line-height 10.8, `--color-accent`). Same component as "Lock" / "Unlock" in the details panel.
- **Fit badges** (`span.badge`): padding 3 / 6, radius 5, text 8.5px, 570, line-height 11.9. Height 18, width hugs text.

| Badge | Fill | Text | Example text |
|---|---|---|---|
| Fits | `--color-success-soft` | `--color-success` | "Fits" |
| Clash | `--color-warning-soft` | `--color-warning` | "Clashes with AE 2320 lecture" |
| Full | `--color-warning-soft` | `--color-warning` | "All sections full" |

Results in the design:

| Code | Title | Meta | Badge |
|---|---|---|---|
| AE 2210 | Introduction to Thermal Engineering | 1 lecture · David Olinger | Fits |
| AB 1533 | Elementary Arabic III | 1 lecture · Mohammed El Hamzaoui | Clashes with AE 2320 lecture |
| AE 2410 | Introduction to Aerospace Structures | 1 lecture · Mark Richman | All sections full |

### Your courses
- Label row: "Your courses" + "1 selected".
- **Course row, selected** (`div.course-row`): 192 wide, bg `--color-surface-selected`, transparent 1px border, radius 10, padding 12 / 10, row gap 9.
  - Color swatch 8 × 8, radius 3, in the course's color (AE 2320 = `--color-course-1`, the dark one). 5 from the top.
  - Info column, gap 3: code "AE 2320" (11px, 700, `--color-ink`) · title "Introduction to Orbital Mechanics" (10px, 400, line-height 16, `--color-ink`, wraps) · chosen sections "CL01 · Lab CX02" (9px, 400, line-height 14.4, `--color-ink-muted`).
- Unselected course rows are the same without the fill (see `div.app-6.md`).

## Header
- **Schedule switcher** (`div.schedule-switcher`) sits in the title row, 16 after the h1. Row gap 7.
  - Arrow buttons: 27 × 29, bg `--color-surface`, border 1px `--color-line-control`, radius 8, chevron-left / chevron-right 12.
  - Count pill: "Schedule 1 of 3", 12px, 650, line-height 17.4, `--color-accent`. bg `--color-surface`, border 1px `--color-accent-line`, radius 8, padding 5.5 / 10. 111 × 31.
- Subtitle: "1 course · 3 schedules fit".
- **Save schedule, enabled**: primary button (bg + border `--color-accent`, white label and white bookmark icon 16). Same size as the disabled one.

## Preferences row
Adds a **blocked-time pill** between the start-time pill and "Block a time". Same pill style as "Starts after" (white, radius 24, padding 8.75 / 10, gap 6):
"Blocked" (9px, 400, `--color-ink-muted`) · "Work" (10px, 650, `--color-ink`) · "· Tue, Fri 2 PM–4 PM" (9px, 400, `--color-ink`) · close (×) icon 10 (2 left margin). The × removes the block.

## Calendar

### Time range
- Auto-fits to the courses: **8:30 AM–4:30 PM** here. Labels: "8:30 AM", "9 AM", "10 AM" … "4 PM", "4:30 PM". Half-hour ends get a label too.
- Hour lines at each full hour. Grid height 536 for 8 hours → **67 px per hour** at this size.
- Caption left: **"Auto-fit · 8:30 AM–4:30 PM"**.

### Day columns
- Each column has 3 left padding; blocks span the column with 3 left / ~3.6 right inset.

### Class block (`<course> <section>, <day>, <time>, <room>`)
Layer name is the accessible label, e.g. "AE 2320 CL01, Monday, 9:00 AM–9:50 AM, Unity Hall 400". Use it as the block's `aria-label`.

- Position: top = start time, height = duration **minus ~3px** (a 50-minute class is ~53 tall at 67 px/hour).
- Box: radius 6, padding 6 / 7, column gap 3, 1px border.
- Content:
  - Title row, gap 4: course code (10px, 700, line-height 13) + section code (8px, 400, line-height 10.4).
  - Time "9:00 AM–9:50 AM" (8px, 400, line-height 10.4, 1 above).
  - Room "Unity Hall 400" (7.5px, 400, line-height 9.75, 85% opacity).
- **Dark course color** (AE 2320 here): bg `--color-course-1`, transparent border, all text `--color-on-accent` (white).
- **Selected block** (Thursday lab CX02): bg `--color-surface-raised`, border 1px `--color-accent` plus a 0.5px `--color-accent` outer ring (`box-shadow: 0 0 0 0.5px`), text `--color-ink`. This is the block whose section is open in the details panel.

### Blocked time (`div.time-block`)
- Covers the exact blocked range (no 3px gap): Tue and Fri 2:00–4:00 PM.
- Fill: **hatch** — diagonal stripes at 135°, 4px `--color-hatch-a` / 4px `--color-hatch-b` (`repeating-linear-gradient(135deg, var(--color-hatch-a) 0 4px, var(--color-hatch-b) 4px 8px)`).
- Border 1px `--color-line-disabled`, radius 6, padding 12.5 top / 7 sides.
- "Work" (9px, 600, line-height 13) then "2:00 PM–4:00 PM" / "blocked" (8px, 400, line-height 12). All `--color-ink-hatch`.

### Early band (`div.early-band`)
- Shown when the grid starts before the start-time preference. Spans all five days from the grid top to 9:00 AM, 3 inset each side. Same hatch, border 1px `--color-line-disabled`, radius 6.
- Centered text "No classes before 9:00 AM" (8px, 400, line-height 11.6, `--color-ink-hatch`), 6 from the top.

## Course details panel — course variant
284 wide (Prototype v1 was 270). Column, gap 4, padding 19 top / 16 sides. Content width 252.

The v2 panel puts the **Lecture professor** filter first, then the sections, and moves the instructor's rating into the lecture card.

1. h2 course code "AE 2320": 21px, 700, letter-spacing −0.55, line-height 25.2, `--color-ink`.
2. Course title "Introduction to Orbital Mechanics": 11px, 510, line-height 17.6, `--color-ink`.
3. **Lecture professor filter** (`div.professor-filter`): column, gap 5, 7 above.
   - Label **"Lecture professor"**: 10px, 650, line-height 14.5, `--color-ink`.
   - **Select** (`div.professor-field`): 252 × 36.5, border 1px `--color-line`, radius 8, padding 11 top / 9 sides / 9 bottom, space-between. Value **"Any professor"** (10px, 400, `--color-ink`) + chevron-down 11.
   - **Hint** (`p.filter-hint`): **"Filters lectures only. Labs and discussions can have other instructors."** 9px, 400, line-height 13.95, `--color-ink-muted`. Wraps to two lines.
4. Label **"Sections in this schedule"** (10px, 650, line-height 14.5, `--color-ink`), 11 above.
5. **Section choice card** (`div.section-choice`), one per chosen section: border 1px `--color-line`, radius 10, padding 15 top / 10 sides / 10 bottom, column gap 8.
   - Heading row (space-between): "Lecture CL01" (10px, 700, `--color-ink`) and either
     - a **neutral badge** "Only lecture" (bg `--color-neutral-soft`, text `--color-neutral-ink`, 8px, 570, line-height 11.2, padding 2 / 6, radius 5) when there is no other choice, or
     - a small accent button **"Lock"** with a lock icon 11 (same style as "Add").
   - Three meta rows, icon 12 + text, gap 8. Text 9px, 400, line-height 13.5, `--color-ink`:
     - clock — "Mon–Fri · 9:00 AM–9:50 AM" (days · time)
     - map pin — "Unity Hall 400"
     - people — "36 of 120 seats open"
   - **Lecture instructor block** (`div.lecture-instructor`), lecture cards only: border-top 1px `--color-line`, padding-top 9, column gap 5.
     - Row, space-between: graduation cap 12 + **"Ye Lu"** (10px, 400, `--color-ink`) on the left; **rating** on the right: star icon 12 + **"— / 5"** (10px, 650, `--color-accent`).
     - Row, space-between: **"Rating unavailable"** (8px, 400, line-height 12, `--color-ink-muted`) and the link **"Rate My Professors"** (8px, 400, `--color-accent`) + external-link icon 9, gap 3. Opens in a new tab.
     - With a rating, the number replaces the dash ("4.4 / 5") and the left text reads "{n} ratings · Example data" (see [`div.app-23.md`](div.app-23.md)).
   - **Lab card** "Lab CX02": four meta rows, the lab instructor as a plain graduation-cap row ("Ye Lu", 9px) and no rating: "Thu · 3:00 PM–3:50 PM" · "Higgins Labs 230" · "4 of 40 seats open" · "Ye Lu".
6. **Disclosure** "View other lab choices" (9px, 400, `--color-ink-muted`) with chevron-down 11 at the far right; 246 wide, 8 above. Expands the list of other lab sections.

The old "Professor" label under the cards and the standalone "Rate My Professors" link are gone.

## Icons added in this state
plus (Add, 11) · chevron left / right (switcher, 12) · close × (blocked pill, 10) · clock, map pin, people, graduation cap (meta rows, 12) · star (rating, 12) · lock (11) · chevron down (disclosure / select, 11) · external link (9). Save button uses a white bookmark.

## Interactive states shown
- Search result cards: rest state. Add buttons are enabled on all three (even the clash and full ones).
- Course row AE 2320: **selected** (filled). Its details are in the right panel.
- Schedule switcher: both arrows enabled.
- Save schedule: **enabled** (primary).
- Calendar: one block **selected** (CX02, indigo outline).
- Toggle "Only open sections": on.

## Data
- **Search** (TypeScript, over `/data/2027-C.json`): matches course code, title or instructor. "3 courses" = number of matches.
- Result meta: count of lecture sections ("1 lecture") · instructor name(s).
- **Fit badge**: whether the course can be added to the current plan.
  - "Fits": a schedule still exists with this course added.
  - "Clashes with AE 2320 lecture": names the planned course and the section type it collides with. The engine diagnosis only names courses (`clashingPairs`), so the "lecture" part has to come from comparing meeting times.
  - "All sections full": every section is full and "Only open sections" is on.
- Course row: code, title, and the chosen section codes for the shown schedule ("CL01 · Lab CX02": lecture code, then "Lab" + lab code).
- Switcher: "Schedule {i} of {n}". Subtitle: "{courses} course(s) · {n} schedules fit".
- Calendar blocks: one per meeting per day of the shown schedule's sections. Room = `meetings[].location`.
- Details panel: the selected course's chosen sections. "Mon–Fri" collapses consecutive days; "Thu" is a single day. Seats = `capacity − enrolled` "of" `capacity` "seats open". "Only lecture" when the course has one lecture section.
- Lecture professor lists lecture instructors only, including co-teachers. Any professor clears the filter. Courses without lectures omit it (see [`div.app-28.md`](div.app-28.md)).
- Rating: the lecture instructor's Rate My Professors score. "— / 5" with "Rating unavailable" when there is none. Rate My Professors links to a search for that instructor.
