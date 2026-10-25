# 14: Integrate and ship

Ticket: 14
Wave: 5
Status: OPEN
Blocked By: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13

**Track:** lead

**What to build:** Everything from the spec works together on `main`. It's checked at phone, tablet and desktop widths, and the project rules now say phone is in scope.

- [ ] Every ticket is merged, and the full suite passes: lint, test, build, the engine tests, and the wasm smoke and reproducibility check.
- [ ] Screenshots:
  - 834 and 1440 px match the design PNGs and the existing references;
  - the new 375 px references are added under `docs/design/screens/`, each with a note, and listed in `docs/design/frames.md`.
- [ ] `CLAUDE.local.md` says phone is in scope at 375 px and screenshots are taken at 375, 834 and 1440 px.
- [ ] The frontend architecture doc covers the phone shell, the day view, the Toast and the bottom Sheet.
- [ ] Whole-app phone check: no sideways scroll on any page, every class's time and room readable, and add, switch, details, remove and Undo all work by touch.
- [ ] The 834 px flow works keyboard-only: add a course, sort, apply a fix, Undo.
- [ ] No console errors.
- [ ] The "Already working" list in the brief still holds: courses, professor picker, no clashes, rules and diagnosis, saved plans, Sections to register.
- [ ] The ui-reviewer agent finds no blocking issues.
