# 05: Guide optional availability

## What to Build

A student following the first-visit tutorial can learn the current defaults, optionally set a start time or block a break, and browse only schedules that satisfy those choices. They can continue without adding time restrictions and finish even when their choices leave no matches.

Parent: [00: First-visit tutorial and lecture professor selection](00-spec.md). Covers user stories 11–16 and 22–24 within the tutorial, plus availability-related keyboard and tablet behavior in stories 35–36.

## Blocked By

- [01: Start new plans at Any time](01-start-new-plans-at-any-time.md). The tutorial explains these settled defaults and must show the same behavior as the planner.
- [04: Guide the first plan once per device](04-guide-the-first-plan-once-per-device.md). This slice extends the working tutorial progression and dismissal behavior.

## Status

Draft. Awaiting approval of the ticket breakdown.

## Scope and Ownership

The tutorial owner adds availability guidance and step behavior. The preferences owner provides targets and interaction with the existing start-time, blocked-time, and open-section controls. The schedule owner handles any needed result-state target. The lead owns shared integration and updated tutorial design references.

Reuse the current preference actions, blocked-time day selection, automatic generation, and explicit no-match recovery. Do not introduce a recurring-break system or duplicate preference inputs.

## Acceptance Criteria

- [ ] Insert availability guidance after course selection and before the results handoff in the existing tutorial.
- [ ] Explain Any time, no blocked time, and Only open sections for a fresh draft. Show the actual values when the student has already changed them; never reset input to match the explanation.
- [ ] Point to the existing start-time and blocked-time controls. The student can set a real start restriction or noon-to-1-PM break for chosen days during the walkthrough.
- [ ] Advancing requires no time preference. Next without changes preserves the current preferences and proceeds to results.
- [ ] Explain that Only open sections is enabled by default and show how to include full sections if the student chooses.
- [ ] Time and open-section choices update results automatically and remain hard restrictions. Back, Skip, completion, and reload retain those choices.
- [ ] If the chosen restrictions eliminate all schedules, allow the tutorial to finish and expose the existing no-match explanation and explicit recovery controls. Never relax choices on the student's behalf.
- [ ] Returning visits still suppress automatic tutorial replay, and the added guidance works by keyboard at desktop and tablet widths.
- [ ] The lead extends the tutorial design references and exact copy for the availability and no-match handoff states.

## Vitest Coverage

- Exercise the tutorial's availability step against public preference actions. Verify optional advancement, retained input after Back or Skip, and progression into both matching and no-match results.
- Reuse store tests to verify that start times, blocked intervals, and Only open sections reach request preparation unchanged. Do not retest the underlying time algorithm if this slice does not change it.
- Verify the explanation reflects actual current settings rather than a fixed initial value.

## Playwright Coverage

- Complete the course step in a fresh browser, advance through availability unchanged, and verify the existing unrestricted-start results remain available.
- In another run, set a start time and a day-specific noon-to-1-PM block while following the guide. Browse actual engine results and confirm each visible timetable respects both.
- Make the restrictions impossible, finish the tutorial, and recover only through an explicit student action. Verify restrictions persist through reload until changed.
- Exercise the open-section toggle, keyboard navigation, and the 834 px layout.

## Completion Checks

Run lint, Vitest, build, and the relevant Playwright suites. Capture availability, optional advancement, and no-match completion at 1440 px and 834 px. The ui_reviewer agent must find no blocking issues.

Do not modify the engine, scripts, published course data, or published engine assets.
