# 03: Audit CS from a loaded tracking sheet

Ticket: 03
Wave: 3
Status: COMPLETE
Blocked By: 02
Triage: ready-for-agent

## What to build

CS testers see the same audit results while the app loads a selected sheet and sends its rules through the real audit request instead of relying on an embedded CS sheet.

## Acceptance criteria

- [x] Introduce stable sheet metadata and lazy loading; the registry records major, class year, official sources, beta/checked state and verification details.
- [x] Send the chosen sheet JSON in the additive API v1 audit request through EngineClient; remove the embedded sheet and keep parsed rules isolated by sheet.
- [x] Move existing CS-specific assumptions into data and express shared rules generically, including unresolved manual checks.
- [x] Validate sheet schema and semantic constraints in CI, including totals, official line numbers and cross-list completeness without double-counting alternatives.
- [x] Existing CS fixtures retain their results through public audit and real-WASM tests; document the updated API and preserve the reproducible build workflow.

## Blocked by

- 02: Restore CS My degree for invited testers

## Ownership and checks

Lead and degree engine integration owns this slice. Shared changes remain lead-owned. Coordinate new shared rule types through the lead; if a new rule becomes a prerequisite for another ticket, record that actual blocking edge before execution. Keep tests at the existing production-app, public degree-source and audit boundaries where applicable. Every code slice needs appropriate logic and browser checks, passing lint/tests/build, and no blocking UI review findings for changed screens.

The user approved this ticket and its testing boundaries. This is an approved local ticket; no external tracker issue has been created.

## Completion

CS rules now load from the sheet registry and travel through EngineClient to
the real audit. The engine caches parsed documents per sheet id and keeps the
previous rules when a replacement is invalid. The embedded CS sheet is removed.
Filters, section references, grouping order and confirmation ids come from data.
CI validates sheet schema, official lines, totals, references and cross-lists.
CS remains an unverified beta for invited testers.

Validation passed: lint, production build, 1,657 Vitest tests, 162 native tests
and all 18 native/WASM smoke comparisons. The final focused checks also pass.
All 52 existing degree browser checks pass, including 1440px, 834px and 375px
captures. Two additional browser checks verify saved history and disabled
sheet-dependent actions when the sheet download fails. The UI reviewer found
no remaining blockers.

Changes are in the working tree. Existing dark-theme work is preserved.
