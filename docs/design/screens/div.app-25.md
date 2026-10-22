# 26 · Lecture professor · Co-teaching and other instructors

- PNG: `div.app-25.png` · Figma node `68:10104` (inside `section#state-26` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 02/03 · Three lecture times stay eligible; Sam Patel’s compatible lab remains locked. Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- Same parts as state 24 ([`div.app-23.md`](div.app-23.md)). Only the differences are listed.

## Scenario
The student chose **Alex Rivera** as lecture professor. Three lecture times stay eligible, so three schedules fit; schedule 3 is shown. Its lecture L03 is co-taught by Alex Rivera and Jordan Kim. The lab B01 (taught by Sam Patel) stays locked.

## Sidebar
- DEMO 1001 row with a **lock icon** 11 after the code, sub **"L03 · B01 · D01"**.

## Header
- Switcher ‹ **"Schedule 3 of 3"** ›.
- Subtitle **"1 course · 3 schedules fit · Lecture professor: Alex Rivera"**. The chosen professor is added to the subtitle.

## Calendar
- Range **12:30 PM–4:30 PM**, caption **"Auto-fit · 12:30 PM–4:30 PM"**. 4 hours over 538 (≈134 px/hour), so blocks use the **regular** sizes (code 10px, section 8px, time 8px, room 7.5px, padding 6 / 7).
- L03 Mon and Wed 1:00 PM–1:50 PM, Example Hall 101 (`--color-course-1`) · D01 Mon 2:00 PM–2:50 PM (`--color-course-3`) · B01 Fri 3:00 PM–3:50 PM (selected, lock icon).

## Details panel
1. Lecture professor ("Optional"), select **"Alex Rivera"**, hint as in state 24.
2. "Sections in this schedule".
3. **Lecture L03** + "Lock" · "Mon, Wed · 1:00 PM–1:50 PM" · "Example Hall 101" · "18 of 40 seats open".
   - **Two instructor blocks** for a co-taught lecture, one under the other, each with its own top border:
     - "Alex Rivera" · "4.4 / 5" · "27 ratings · Example data" · "Rate My Professors"
     - "Jordan Kim" · "4.1 / 5" · "15 ratings · Example data" · "Rate My Professors"
4. Lab B01 + **"Unlock"** · "Fri · 3:00 PM–3:50 PM" · "Example Lab 202 · Sam Patel" · "8 of 24 seats open".
5. Discussion D01 + "Compatible" · "Mon · 2:00 PM–2:50 PM" · "Example Hall 103 · Riley Chen" · "8 of 24 seats open".
6. Disclosure **"2 other lecture times · Unlocked"** with chevron-down 11.

## Rules this state documents
- A professor choice keeps every lecture that professor teaches, including co-taught ones.
- The lab instructor can be someone else. The lab lock stays when the professor changes.

## Data
- Engine request: lecture sections limited to Alex Rivera's, `locked` keeps B01.
- "{n} other lecture times · Unlocked": the remaining eligible lecture sections for the chosen professor, and whether the lecture is locked.
