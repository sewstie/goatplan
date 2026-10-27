# 07: "Allow any professor" fix

Ticket: 07
Wave: 3
Status: DONE
Blocked By: 01, 03

**Track:** prefs (the lead owns the diagnosis text module)

**What to build:** When a professor choice is why nothing fits, the student gets "Allow any professor for PH 1110". When that isn't enough alone, they get "Allow any professor for PH 1110 and change to 11:00 AM". One click applies it and schedules appear.

- [ ] Fix labels:
  - without `startsAfter`: "Allow any professor for PH 1110";
  - with it: "Allow any professor for PH 1110 and change to 11:00 AM", in the same time format as "Change to 10:00 AM";
  - with `startsAfter` 0: "Allow any professor for PH 1110 and clear start restriction".
- [ ] The count line works like the other fixes ("10 schedules fit", "At least …").
- [ ] Applying it clears the professor in the course panel and, when the fix includes a start time, updates "Starts after". There is one solve, and schedules appear.
- [ ] A professor with no sections this term also gets the fix (from 01), and applying it works the same way.
- [ ] Long labels wrap inside the fix row at 834 px. The count stays readable and nothing is cut off.
- [ ] `docs/design/copy.md` lists the new labels.
- [ ] Tests: the diagnosis text labels; a browser spec on 2027-C for the 11 AM case (plain fix), the 12 PM case (combined fix) and the unavailable-professor case, each applied by click and by keyboard.
