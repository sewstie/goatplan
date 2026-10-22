# 24 · Fresh plan · Any time

- PNG: `div.app-23.png` · Figma node `68:9413` (inside `section#state-24` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 01 · Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)), course panel from [`div.app-3.md`](div.app-3.md). This file is the reference for the **fresh-plan preferences**, the **"Optional" professor label**, **ratings with a score** and the **compact lab and discussion cards**. States 25–29 and 34 reuse them.

## Scenario
A new plan with one synthetic course, DEMO 1001, that has a lecture, a lab and a discussion. Four schedules fit; schedule 1 is shown. Preferences are at their defaults: Any time, no blocked time, Only open sections on. Nothing is locked.

DEMO courses, instructors, rooms and ratings are layout examples. Don't put them in course data.

## Sidebar
- "Your courses" · "1 selected".
- DEMO 1001 row (unselected style, no lock): code **"DEMO 1001"**, title **"Engineering Seminar"**, sub **"L01 · B01 · D01"** (lecture · lab · discussion codes, no "Lab" prefix).

## Header
- Switcher with arrows: ‹ **"Schedule 1 of 4"** ›.
- Subtitle **"1 course · 4 schedules fit"**. Save schedule enabled.

## Preferences — fresh defaults
- **Start-time pill, Any time**: label **"Start"** (9px, 400, `--color-ink-muted`) + value **"Any time"** (10px, 650, `--color-ink`) + chevron-down 12. Same pill style as "Starts after" (white, radius 24, padding 8.75 / 10, gap 6), 108 wide. The label is "Start" while the value is Any time, and "Starts after" once a time is picked.
- "Block a time" (dashed chip), no blocked-time pill.
- Only open sections: on.

## Calendar
- Range **7:30 AM–4:30 PM**, caption **"Auto-fit · 7:30 AM–4:30 PM"**. Grid 538 high for 9 hours (≈60 px/hour), **compact** block sizes.
- **No early band**: with Any time, nothing is hatched before the first class.

| Course | Section | Day | Time | Room | Style |
|---|---|---|---|---|---|
| DEMO 1001 | L01 | Tue, Thu | 8:00 AM–8:50 AM | Example Hall 101 | `--color-course-1` |
| DEMO 1001 | D01 | Mon | 2:00 PM–2:50 PM | Example Hall 103 | `--color-course-3` |
| DEMO 1001 | B01 | Fri | 3:00 PM–3:50 PM | Example Lab 202 | selected |

Lecture, lab and discussion of one course use different color slots here (dark lecture, yellow discussion, selected lab). Confirm whether the app should color by course or by section type before building.

## Details panel (DEMO 1001)
1. h2 **"DEMO 1001"**, title **"Engineering Seminar"**.
2. **Lecture professor** row: label "Lecture professor" on the left and **"Optional"** on the right (8px, 400, line-height 11.6, `--color-ink-muted`, bottom-aligned). Select **"Any professor"**.
   - Hint, v2 wording for courses with labs or discussions: **"Filters lectures only. Compatible labs and discussions can have other instructors."**
3. "Sections in this schedule".
4. **Lecture card** (regular section card): "Lecture L01" + **"Lock"** · "Tue, Thu · 8:00 AM–8:50 AM" · "Example Hall 101" · "18 of 40 seats open".
   - Instructor block with a score: **"Alex Rivera"** · star + **"4.4 / 5"** (10px, 650, `--color-accent`) · **"27 ratings · Example data"** (8px, `--color-ink-muted`) · "Rate My Professors".
5. **Compact component cards** for the lab and the discussion (`div.section-choice`, padding 13 top / 10 sides / 8 bottom):
   - Heading row: "Lab B01" + neutral badge **"Compatible"** (same style as "Only lecture").
   - One meta row, 2 above: clock 12 + **"Fri · 3:00 PM–3:50 PM"** (9px, `--color-ink`).
   - Two lines, 1 above each: **"Example Lab 202 · Sam Patel"** and **"8 of 24 seats open"** (8px, 400, line-height 12.8, `--color-ink-muted`). Room and instructor share a line; there is no rating for lab or discussion instructors.
   - Discussion card: "Discussion D01" + "Compatible" · "Mon · 2:00 PM–2:50 PM" · "Example Hall 103 · Riley Chen" · "8 of 24 seats open".
6. No "View other … choices" disclosure in this frame.

## Interactive states shown
- Start-time pill at its default (Any time). No blocked time. Toggle on.
- B01 block selected. Nothing locked.

## Data
- New plan defaults: `startsAfter: 0` (Any time), no blocked times, Only open sections on. See [`../frames.md`](../frames.md#new-plans).
- "Compatible": a lab or discussion that the engine paired with the shown lecture. It is a label, not a choice control.
- Rating: "{score} / 5" and "{count} ratings". "Example data" marks the synthetic numbers; real ratings need a source line from the data provider.
