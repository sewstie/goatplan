# 06: Free-time gap badge

Ticket: 06
Wave: 2
Status: DONE
Blocked By: 01, 02

**Track:** schedule

**What to build:** The gap badge says how much free time the student has between classes, ignoring the 10-minute walks between back-to-back classes. It uses the same rule as the "Most compact" sort, so the top schedule never shows more free time than the next one.

- [ ] The badges module takes the shown schedule's score as well as its meetings and the preset, and reads `freeMinutes`.
- [ ] Wording, with 1 h or more rounded to the nearest 30 minutes:
  - 0 → "No gaps between classes"
  - 1–59 → "40 min free between classes"
  - 60 or more → "1 h free between classes", "2.5 h free between classes", "3 h free between classes"
- [ ] When `freeMinutes` is missing (a plan saved before this change), the badge works it out from the meetings with the same rule, inside the badges module.
- [ ] The old 30-minute gap count is removed. The badge keeps its place in the order, and its pill look is unchanged.
- [ ] `docs/design/copy.md` lists the new wording.
- [ ] Tests through the badges interface:
  - 0, 40, 60, 75, 150 and 180 minutes;
  - the fallback path;
  - the leading badge unchanged.
  - The existing schedule-badges browser spec is updated, and under Most compact #1's free time is at most #2's.
