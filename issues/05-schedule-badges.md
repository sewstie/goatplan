# 05: Badges for the shown schedule

**Track:** SCHEDULE

**What to build:** Next to "3 courses · 24 schedules fit", the schedule on screen shows up to three badges that say what it's good at:

- "Starts 10 AM"
- "Done by 3 PM"
- "Fri off" / "Mon, Fri off" / "3 days off"
- "No gaps" / "1 gap" / "4 gaps"

The badge for the current Sort order comes first. The badges update as the student flips through schedules, and they replace today's score chips.

**Blocked by:** 01 (preset IDs), 02 (engine before UI).

**Status:** DONE

- [ ] One deep function in the schedule copy module replaces the score-chips function at the same seam. Its input is the shown schedule's meetings (day, start, end) and the current preset ID. Its output is an ordered list of at most 3 badge texts.
- [ ] Inside the function, out of its interface: the week facts (earliest start, latest end, free weekdays, breaks), the wording and the time format. No exported helper per badge.
- [ ] Rules:
  - Start is the earliest class start of the week, and Finish is the latest class end.
  - Days off counts Mon–Fri days with no class: one day → "Fri off", two → "Mon, Fri off", three or more → "3 days off".
  - Gaps counts breaks of 30 minutes or more between classes on the same day, over the week.
- [ ] Order:
  - The current order's badge comes first: Latest start → Start, Fewest early → Start, Earliest finish → Finish, Most days off → Days off, Most compact → Gaps. Best overall has no lead badge.
  - The rest follow in the order Days off, Start, Gaps, Finish.
  - At most 3 are shown.
- [ ] Badges that say nothing (no free weekday) are left out. Classes with no set time don't count.
- [ ] Shown and hidden exactly when the score chips are today: hidden while solving, when nothing fits, and for saved plans.
- [ ] Look: the score chips' pill styling (surface fill, pill radius, muted ink at 8.5 px / 570, no wrapping inside a badge), with theme tokens only. Accessibility: a list named "This schedule", not focusable, not a live region.
- [ ] 834 px: the summary line wraps, and the badges move to the next line as whole pills (4 px row gap, 8 px column gap), never cut off.
- [ ] Unit tests through the function only:
  - each rule;
  - the 30-minute threshold;
  - the lead badge for each order;
  - the cap of 3;
  - empty badges left out;
  - an empty week;
  - classes with no set time.

  The old score-chip tests are replaced.
- [ ] Its own Playwright spec: flipping to the next schedule updates the badges; badges wrap without overflow at 834 px. Screenshots at 1440 and 834 px.
- [ ] `npm run lint`, `npm run test` and `npm run build` pass.
