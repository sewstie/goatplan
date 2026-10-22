# 02: Filter courses by lecture professor

## What to Build

A student can choose one lecture professor for a course and browse every returned timetable using a lecture taught by that person. All qualifying lecture times and co-taught lectures remain eligible. Compatible labs and discussions can have other instructors.

Parent: [00: First-visit tutorial and lecture professor selection](00-spec.md). Covers user stories 26–31, 34, and professor selection accessibility in story 35. Ticket 03 covers lock conflicts and unavailable restored selections.

## Blocked By

None.

## Status

Draft. Awaiting approval of the ticket breakdown.

## Scope and Ownership

The preferences owner changes the professor picker and section-choice UI. The lead owns shared instructor eligibility, local fit checks, store actions, request construction, and shared diagnosis consistency. Coordinate all of those changes within this ticket; do not deliver a picker that the solver or alternative-section controls can bypass.

If a reusable lecture-eligibility helper makes the work easier, add it as part of this slice and migrate the relevant callers before completing the ticket. Do not create a separate refactor prerequisite.

## Acceptance Criteria

- [ ] Any professor remains the default and removes the professor restriction when selected.
- [ ] The picker lists only instructors assigned to lecture sections. Instructors appearing solely on labs or discussions are not offered as lecture professors.
- [ ] Courses without lectures omit this filter and retain normal individual section selection.
- [ ] Selecting a professor regenerates results using the existing engine contract and only eligible lecture section IDs. No lecture time is implicitly locked by choosing a professor.
- [ ] Co-taught lectures qualify when the selected professor is one of the listed instructors. Reuse trimmed, case-insensitive full-name matching.
- [ ] A name matching only a lab or discussion cannot qualify a lecture taught by someone else.
- [ ] Valid linked labs and discussions taught by other instructors remain eligible under the remaining restrictions. The published course options still determine valid bundles.
- [ ] Alternative choices, same-time alternatives, direct option selection, and diagnosis previews use the same lecture-only rule. None can expose a nonmatching lecture as a valid choice.
- [ ] Clearing the professor broadens the eligible lectures while preserving time and open-section restrictions.
- [ ] Keep the existing automatic generation, schedule browsing, result-limit messages, section details, and registration identifiers.

## Vitest Coverage

- Exercise public store actions and request preparation with multiple lectures by one professor, co-teaching, another professor's lecture, and labs or discussions taught by other people.
- Verify the request includes only matching lecture IDs and the local section-choice and diagnosis behavior agrees with that eligibility.
- Verify selection and clearing through the picker, hidden controls for a course without lectures, and keyboard-accessible labels using the existing component test setup where useful.

## Playwright Coverage

- Use controlled term responses with the actual WebAssembly engine. Choose a professor, browse all returned lecture times, and inspect the linked lab and discussion identifiers.
- Include a trap case where the selected name appears on a non-lecture component paired with a different professor's lecture. That bundle must not become a result or selectable alternative.
- Exercise an alternative-section change, co-teaching, clearing the selection, and a course without lectures. Test through visible controls, not a parallel test-only solver.

## Completion Checks

Run lint, Vitest, build, and the relevant Playwright suites. Capture the picker and section-choice states at 1440 px and 834 px against the design references. The ui_reviewer agent must find no blocking issues.

Do not change saved-plan schemas or engine interfaces. Do not modify the engine, scripts, published course data, or published engine assets.
