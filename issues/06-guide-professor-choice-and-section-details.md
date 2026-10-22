# 06: Guide professor choice and section details

## What to Build

A student following the first-visit tutorial discovers optional lecture professor selection and learns how to inspect the section details of the schedule they like. The walkthrough ends with a usable existing path to save that choice and find the lecture, discussion, and lab identifiers for Workday.

Parent: [00: First-visit tutorial and lecture professor selection](00-spec.md). Covers user stories 20–21, 25–31 within the tutorial, and the remaining keyboard and tablet guidance in stories 35–36.

## Blocked By

- [02: Filter courses by lecture professor](02-filter-courses-by-lecture-professor.md). The tutorial must teach the agreed lecture-only picker rather than the old any-component behavior.
- [04: Guide the first plan once per device](04-guide-the-first-plan-once-per-device.md). This slice extends the working course step and results handoff.

Tickets 03 and 05 are not prerequisites: this guidance does not implement conflict recovery or the availability step. Preserve those extensions if they have already landed, and keep their agreed behavior when they arrive.

## Status

Draft. Awaiting approval of the ticket breakdown.

## Scope and Ownership

The tutorial owner extends course guidance and the results handoff. The preferences owner coordinates the actual course-details and professor-picker targets. The schedule owner coordinates the displayed schedule and course-detail targets. The plans owner coordinates the existing save and Sections to register handoff only if a tutorial target is needed. The lead owns shared mounting, state integration, and design references.

Use existing selection actions to reveal the relevant real course details. Do not create a parallel details panel, new saved-plan storage, or a new registration page.

## Acceptance Criteria

- [ ] During course guidance, point out the actual Professor control for a selected course with lectures. Any professor stays the default, and choosing a name is optional.
- [ ] Following the professor tip opens or selects the relevant real course details without adding courses, choosing a professor automatically, or losing the student's existing choices.
- [ ] If no selected course has lectures, omit that tip or advance past it without a missing target or blocked progression. Do not expose a lecture professor picker for a lab-only or discussion-only course.
- [ ] A student who chooses a professor continues with the real filtered results. Next, Back, Skip, and completion preserve that selection.
- [ ] At the results handoff, show where to browse returned schedules and inspect the currently displayed course's lecture, discussion, and lab identifiers. Detail targets track the actual selected course and timetable rather than interview example codes.
- [ ] Explain the existing saved-plan path to Sections to register and its copy and print controls. Do not require saving or registering to finish the tutorial.
- [ ] Empty results, loading states, and courses without particular component types do not leave the tutorial waiting for a nonexistent section target. Completion remains available without automatically changing preferences.
- [ ] Preserve result-limit and incomplete-search disclosures. The guide must not promise more schedules than the engine returns or claim that registration happens inside GoatPlan.
- [ ] Add the relevant tutorial design references and exact copy through the lead. Keyboard focus, labels, and target visibility work at desktop and tablet widths.

## Vitest Coverage

- Exercise optional professor guidance against the actual selected course and public store actions. Cover choosing a professor, retaining Any professor, and courses without lecture targets.
- Verify the results guidance resolves targets from the displayed schedule and chosen course, handles missing component types, and allows completion with no matches.
- Reuse existing registration and plan-opening test interfaces where the handoff is touched. Do not add tests of unchanged copy or print internals solely to increase coverage.

## Playwright Coverage

- In a fresh browser, follow the course tip, choose a lecture professor, finish the guide, and browse actual engine results. Inspect the lecture and compatible lab or discussion identifiers as the timetable changes.
- Exercise the same flow while leaving Any professor unchanged and with a course that has no lecture. Neither case may trap the walkthrough.
- Save the chosen schedule through the existing flow, open Sections to register, and verify its lecture, discussion, and lab identifiers agree with the displayed choice. The tutorial itself must also be completable without saving.
- Exercise keyboard navigation and the 834 px layout. If the availability or conflict-recovery tickets have landed, run their existing journeys with this guidance enabled to catch integration regressions.

## Completion Checks

Run lint, Vitest, build, and the relevant Playwright suites. Capture professor guidance and the details handoff at 1440 px and 834 px. The ui_reviewer agent must find no blocking issues.

Do not add Workday integration or alter schedule limits. Do not modify the engine, scripts, published course data, or published engine assets.
