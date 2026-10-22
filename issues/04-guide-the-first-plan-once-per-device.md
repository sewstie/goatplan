# 04: Guide the first plan once per device

## What to Build

A first-time student can follow a short tutorial through the existing term selector and course search, add real courses, and reach the existing schedule browser. They can skip or move back without losing work, and the tutorial does not automatically return after dismissal or completion.

This is a complete initial tutorial. Tickets 05 and 06 extend it with optional availability and professor guidance; do not leave empty steps or placeholder controls for those later slices.

Parent: [00: First-visit tutorial and lecture professor selection](00-spec.md). Covers user stories 1–10, 18–19, 22, and the tutorial portions of stories 35–36.

## Blocked By

None.

## Status

Draft. Awaiting approval of the ticket breakdown.

## Scope and Ownership

The tutorial owner owns walkthrough components, progression, and tutorial-local persistence. The search owner provides targets for the existing term and course controls. The schedule owner provides the browsing target. The lead owns page and shell integration, any shared primitive changes, and design documentation.

The tutorial must use the existing planner store. Do not create duplicate course-entry forms, a separate working draft, or another generation pipeline. Keep first-visit state outside per-term draft and saved-plan data.

## Acceptance Criteria

- [ ] On a fresh browser profile, display the tutorial after client initialization without accessing browser storage during server rendering.
- [ ] Point to the existing term selector and course search. Use the student's real choices and explain that adding courses generates schedules automatically.
- [ ] Require a valid loaded term before advancing from term selection and at least one selected course before advancing from course selection. Do not require a full course load.
- [ ] Provide Back, Next, and Skip with clear labels, visible focus, and deliberate focus placement between steps and after dismissal. Target controls remain usable by keyboard and at both supported widths.
- [ ] Going back, skipping, closing through supported dismissal controls, or finishing preserves real planner input. Dismissal does not roll back course or term choices.
- [ ] Finish at the existing schedule browser. Completion does not depend on obtaining a matching schedule; no-match results do not trap the student. Preserve existing loading, error, and incomplete-search handling.
- [ ] Remember completion or dismissal across reloads and later visits in the same browser. Switching terms does not restart the tutorial. A clean separate browser profile is eligible for its own first visit.
- [ ] A returning student with a restored plan reaches the normal planner without having to reenter the plan or repeat the tutorial.
- [ ] Unavailable or throwing browser storage does not crash or prevent use of the planner. Do not promise persistent dismissal when storage cannot be written.
- [ ] The lead adds the tutorial's design reference and exact copy using the existing visual language. Include desktop, tablet, step validation, and dismissal states in the reference.

## Vitest Coverage

- Exercise the tutorial through user-visible controls with the existing component and planner-store test setup. Verify valid-term and course-count progression, Back, Skip, and preservation of the actual draft.
- Use the existing storage seam or a narrow injected tutorial persistence seam to cover completion, dismissal, returning visits, and blocked storage. Test observable presentation and retained choices, not private step-number assertions.
- Cover completion when the planner has no matches or an existing error state without inventing a new solving interface.

## Playwright Coverage

- In a fresh browser, choose a term, add a real course from controlled term data, and finish at usable results produced by the actual engine. Browse returned schedules through existing controls.
- Follow the flow by keyboard and exercise disabled advancement, Back, and Skip after entering a course. Verify entered choices remain in the normal planner.
- Reload after completion and after skipping, switch terms, and open a previously stored plan. Confirm no unwanted automatic tutorial replay or loss of data.
- In separate fresh contexts, exercise no-match completion and unavailable storage. Verify that the planner remains usable.

## Completion Checks

Run lint, Vitest, build, and the relevant Playwright suites. Capture the complete initial tutorial at 1440 px and 834 px against the new design references. The ui_reviewer agent must find no blocking issues.

Use existing tokens, DM Sans, and small components. Do not modify the engine, scripts, published course data, or published engine assets.
