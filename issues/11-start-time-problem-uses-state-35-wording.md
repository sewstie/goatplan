# 11: Start-time problem uses state 35 wording

**What to build:** When a start time rules out a course's only lecture, the "Needs attention" panel reads "Your start time excludes this lecture", with "{course}’s only lecture starts at {time}, but Starts after is set to {start}.". The fixes are "Change to {time}" and "Clear start restriction". This applies everywhere, in place of state 09's "Your start time is too late" / "Remove {course}". "Clear start restriction" sets the start back to Any time and keeps the course.

Parent: [00-spec](00-spec.md), user story 52. Screens: `div.app-34` (wording), `div.app-8` (layout).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Needs from lead
None, unless clearing the start restriction needs a new fix type in the store. If it does, ask for it.

## Acceptance criteria
- [ ] **Copy:** the diagnosis text and fixes use the state 35 copy exactly.
- [ ] **Clear start restriction:** sets Starts after to Any time, keeps courses, locks and blocked times, then re-solves.
- [ ] **Removing a course:** if still offered, it stays available only as its own separate fix, not as the start-time fix.
- [ ] **Vitest:** diagnosis text for the start-time case, and that the fix keeps courses, locks and blocked times.
- [ ] **Playwright at 1440 px:** update the start-time diagnosis screenshot and compare it with `div.app-8.png`. The wording differs by decision. Apply the fix with the keyboard.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
