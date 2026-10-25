# 03: Engine: "Allow any professor" combined with a start time

Ticket: 03
Wave: 2
Status: OPEN
Blocked By: 02

**Track:** ENGINE (allowed for this work; same structure and formatting, no comments, commits separate from the UI)

**What to build:** When a chosen professor plus a late start time leave a course with no options, the diagnosis offers a fix that works in one click. It allows any professor and moves the start time to the latest one that then gives schedules. Today, at 12 PM or later (2027-C, MA 1024 + CS 2022 + PH 1110 with Burnham), only "Change to 10:00 AM" is offered. It waits for 02 because both rebuild the same WebAssembly file.

- [ ] `docs/engine-api.md` changes first: `clearAnyOf` may carry `startsAfter`, which means "remove the course's `anyOf` and set `preferences.startsAfter` to this". Additive to version 1.
- [ ] For a course with a nonempty `anyOf` that removed options, `clearAnyOf` alone is tried first, as today.
- [ ] If that gives 0 and a start time is set, the engine finds the latest `startsAfter` that gives schedules once that course's `anyOf` is cleared. If there is one, it returns `{kind: "clearAnyOf", course, startsAfter, schedules, capped}`.
- [ ] Only the start time is combined, never blocked times or full sections.
- [ ] Fix ordering doesn't change: preference changes first, dropping a course last, more schedules first.
- [ ] Tests:
  - the 12 PM case returns the combined fix, and applying it gives the stated count;
  - the 11 AM case still returns plain `clearAnyOf`;
  - no combined fix when the start time isn't the problem.
  - The golden files are updated only where the new fix appears.
- [ ] The WebAssembly build is rebuilt and committed with the source and is reproducible.
