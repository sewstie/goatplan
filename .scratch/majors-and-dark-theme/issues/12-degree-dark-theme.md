# 12: Carry the global theme into My degree

Ticket: 12

Wave: 3

Status: COMPLETE

Blocked By: 02, 10

Triage: ready-for-agent

## What to build

Students opening My degree retain their global theme and can read tiles, charts, pins, confirmations and progress states in Light or Dark.

## Acceptance criteria

- [x] Apply the existing global preference and controls without a separate degree-only theme setting.
- [x] Provide readable completed, planned, empty, check and chart-grid states through semantic tokens.
- [x] Verify header, picker, history, detail panels and feedback surfaces in both themes and preserve light print behavior.
- [x] Review desktop/tablet screenshots and relevant keyboard, contrast and browser behavior with no blocking UI findings.
- [x] This integration is required before exposing both degree and dark theme together; it does not block either feature while the other is absent.

## Blocked by

- 02: Restore CS My degree for invited testers
- 10: Use a persistent Light/Dark planner toggle

## Ownership and checks

Degree theme, with lead token integration owns this slice. Shared changes remain lead-owned. Coordinate new shared rule types through the lead; if a new rule becomes a prerequisite for another ticket, record that actual blocking edge before execution. Keep tests at the existing production-app, public degree-source and audit boundaries where applicable. Every code slice needs appropriate logic and browser checks, passing lint/tests/build, and no blocking UI review findings for changed screens.

The user approved this ticket and its testing boundaries. This is an approved local ticket; no external tracker issue has been created.

## Validation

Desktop and phone use the existing global controls. Dark tokens cover degree
tiles, pins, confirmations, chart fills, empty tracks and chart grids. Light
values and print colors are preserved. TDD checks first failed for the missing
controls and tile contrast. UI review found a planned/empty contrast issue;
a regression test and separate completed/planned/empty tokens resolve it.

The combined checkout passes lint, build, 1,660 Vitest tests and 73 browser
checks, including 11 degree theme checks. Screenshots cover both themes at
1440, 834 and 375 px. The ui_reviewer found no remaining issues.

See `docs/degree-dark-theme.md` for the checked surfaces and test evidence.
Degree access remains behind the existing tester flag.
