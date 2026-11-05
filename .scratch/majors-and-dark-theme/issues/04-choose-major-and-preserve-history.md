# 04: Choose a major without losing sheet state

Ticket: 04

Wave: 4

Status: COMPLETE

Blocked By: 03

Triage: complete

## What to build

Students can select an available major, retain shared courses and each sheet's pins and confirmations, and export or import their complete degree history.

## Acceptance criteria

- [x] Provide labeled desktop and phone major pickers, selected-major headers and Change; show Class of 2030 and unsupported-program limitations before entry.
- [x] Keep courses shared, save pins and manual confirmations per sheet, restore the last selection, and rerun the selected audit without showing stale responses.
- [x] Migrate old histories to CS without another picker prompt and round-trip all sheets' state through validated backups and imports.
- [x] Offer beta sheets only to invited testers with one feedback message; unsupported majors have Coming soon and a request action sending only the major name.
- [x] Exercise switching with independent fixture sheets through existing source and production-browser boundaries; verify keyboard, touch, reload and selected-sheet-only downloads.

## Blocked by

- 03: Audit CS from a loaded tracking sheet

## Ownership and checks

Degree, with lead integration owns this slice. Shared changes remain lead-owned. Coordinate new shared rule types through the lead; if a new rule becomes a prerequisite for another ticket, record that actual blocking edge before execution. Keep tests at the existing production-app, public degree-source and audit boundaries where applicable. Every code slice needs appropriate logic and browser checks, passing lint/tests/build, and no blocking UI review findings for changed screens.

The user approved this ticket and its testing boundaries. This is an approved local ticket; no external tracker issue has been created.

## Completion

Implemented with TDD through the approved source and production-browser
boundaries. The picker keeps shared courses and independent sheet state,
restores legacy CS histories and the last selection, and exports every sheet.
Imports validate pins against the incoming selected sheet. Degree audits and
search badges discard old-major results. A request sends only the major name.

Lint, production build and all 1,676 Vitest tests pass. The degree production
browser suite passes 69 checks. Six additional checks use an independent
fixture sheet in an isolated production build with the real audit, keyboard
and touch. Screenshots cover 1440, 834 and 375 px. The UI reviewer found no
blocking findings. Design PNG comparison was unavailable because the design
directory is absent in this checkout.

CS remains the only registered sheet and stays behind tester access. Tickets
05–08 add the other major sheets. No public release or external issue update
was performed. Storage and fixture checks are documented in
`docs/degree-major-selection.md`.
