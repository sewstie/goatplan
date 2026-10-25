# 05: Honest sorting end to end

Ticket: 05
Wave: 2
Status: OPEN
Blocked By: 01, 02, 04

**Track:** sort (prefs owns the Sort control; the lead owns the copy doc)

**What to build:** Each sort's top schedule is the best on its own measure. Switching sorts changes the top schedule whenever a better one exists for the new sort. A student who picks "Most days off" never sees a 5-day schedule above a 4-day one. Schedules that tie fall back to Best overall.

- [ ] The Sort menu shows the six labels and the new descriptions for Latest start ("Classes start as late as possible each day") and Earliest finish ("Classes end as early as possible each day").
- [ ] `docs/design/copy.md` lists the two new descriptions.
- [ ] The read-only Sort chip on saved plans still shows the preset's label.
- [ ] The leading badge for each sort is unchanged, and on #1 it's at least as good as on #2 (Start for Latest start, Finish for Earliest finish, Days off for Most days off).
- [ ] Browser spec against the production build:
  - each sort is picked by its accessible name;
  - under Most days off, #1 has no more days on campus than any shown schedule;
  - at least two sorts give a different #1 on the brief's course set;
  - the sort survives reload and save-and-open.
- [ ] Real-data check on 2027-C with MA 1024, CS 2022 and PH 1110, recorded in the PR: each sort's #1 and its measure.
- [ ] Screenshots at 1440 and 834 px still match the existing sort references.
