# 07: Make ECE Class of 2030 available to testers

Ticket: 07  
Wave: 5  
Status: COMPLETE  
Blocked By: 04  
Triage: ready-for-agent

## What to build

Invited ECE students can select their official Class of 2030 sheet, audit their history and use matching search badges and term actions.

## Acceptance criteria

- [x] Record the official Class of 2030 tracking sheet and 2026–27 catalog sources; missing sources block completion.
- [x] Represent every requirement and official line number, including design rules, cross-lists and manual items; document interpretations as unresolved checks.
- [x] Implement missing rule types generically with native and TypeScript behavior coverage.
- [x] Create independently hand-worked mid-degree and complete histories shared by native and TypeScript/WASM tests.
- [x] Verify selection, audit, badges and term actions through the real app; leave the sheet beta and tester-only pending Workday verification.

## Blocked by

- 04: Choose a major without losing sheet state

## Ownership and checks

ECE sheet, with lead support for new generic rules owns this slice. Shared changes remain lead-owned. Coordinate new shared rule types through the lead; if a new rule becomes a prerequisite for another ticket, record that actual blocking edge before execution. Keep tests at the existing production-app, public degree-source and audit boundaries where applicable. Every code slice needs appropriate logic and browser checks, passing lint/tests/build, and no blocking UI review findings for changed screens.

The user approved this ticket and its testing boundaries. This is an approved local ticket; no external tracker issue has been created.

## Completion

Completed November 5, 2026. Sources, numbered requirements and interpretations
are recorded in `docs/ece-2030-report.md`. Existing generic filters, priorities,
cross-lists and manual checks express the sheet; no new rule type was needed.
Engine source and committed WASM were not changed.

Lint, all 1,713 tests with native fixtures enabled, the production build, 163
native engine tests and seven production browser checks pass. The UI reviewer
found no blockers in the 1440px and 834px screenshots. Design PNGs are absent
from this checkout, so review used the established degree UI.

ECE remains beta and tester-only. Workday verification belongs to ticket 09.
