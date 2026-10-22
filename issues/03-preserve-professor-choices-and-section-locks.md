# 03: Preserve professor choices and section locks

## What to Build

A student keeps control of explicit professor selections and locked sections when they conflict. Show no matching schedules with a useful explanation rather than automatically unlocking a section or ignoring a professor. A restored plan with an unavailable professor also remains restricted until the student changes that choice.

Parent: [00: First-visit tutorial and lecture professor selection](00-spec.md). Covers user stories 23–24, 31–33, and the saved-plan portion of story 17.

## Blocked By

- [02: Filter courses by lecture professor](02-filter-courses-by-lecture-professor.md). This slice needs the lecture-only eligibility rule to distinguish valid, incompatible, and unavailable choices consistently.

## Status

Draft. Awaiting approval of the ticket breakdown.

## Scope and Ownership

The lead changes public store behavior, request preparation, restoration handling where needed, and shared diagnosis logic. The preferences owner changes the picker notices, conflict explanations, and recovery controls. The plans owner handles any necessary saved-plan opening integration.

Keep existing stored professor fields and explicit recovery actions. Replace the existing automatic-unlock behavior and its tests; do not preserve a misleading unlocked-section notice.

## Acceptance Criteria

- [ ] Selecting or clearing a professor never automatically removes lecture, lab, or discussion locks.
- [ ] A compatible locked lab or discussion remains locked even when its instructor differs from the selected lecture professor.
- [ ] An incompatible locked lecture and selected professor remain visible in the plan and produce no matching schedules. Other preferences remain unchanged.
- [ ] Explain the conflict and offer applicable existing explicit actions, such as clearing the professor or unlocking a section. Nothing is relaxed before the student acts.
- [ ] The student can recover through the visible controls; results regenerate after their chosen change, and other explicit restrictions remain in effect.
- [ ] Draft restoration and saved-plan opening retain professor choices, locks, and preferences without adopting new defaults.
- [ ] If a restored selected professor has no eligible lecture, expose a recoverable no-match state. Never pass an empty allowlist as though it enforced that choice: the current engine contract treats it as unrestricted.
- [ ] Handle this validation case in the frontend without fake section IDs, engine changes, or a second schedule solver. The student can explicitly clear the unavailable choice even if it is absent from the normal list of lecture instructors.
- [ ] Keep incomplete-search and engine-error messages distinct from a confirmed no-match result. Do not retain stale schedules that violate the new selection.

## Vitest Coverage

- Through public store actions, select a professor with compatible and incompatible lecture, lab, and discussion locks. Verify locks, stored choices, and resulting requests or no-match state.
- Restore drafts and open saved plans containing valid, conflicting, and unavailable professor selections. Check that no restriction silently disappears.
- Verify explicit recovery changes only the choice the student requested and does not clear unrelated availability or locks.
- Replace the existing automatic-unlock expectations. Cover the empty-allowlist contract through observable behavior, not only the shape of a request.

## Playwright Coverage

- Lock a lecture, choose an incompatible professor, observe no matches, and verify the lock and selected professor are still present after reload.
- Keep a compatible lab locked under a different instructor and confirm schedules still use it.
- Recover by clearing the professor in one case and explicitly unlocking in another. Check results through the actual engine and inspect the selected sections.
- Open a saved plan with an unavailable professor. Confirm no unrestricted timetable appears, then clear that choice and confirm otherwise valid schedules return.

## Completion Checks

Run lint, Vitest, build, and the relevant Playwright suites. Capture conflict, unavailable-selection, and recovery states at 1440 px and 834 px. The ui_reviewer agent must find no blocking issues.

Do not change saved-plan schemas or engine contracts. Do not modify the engine, scripts, published course data, or published engine assets.
