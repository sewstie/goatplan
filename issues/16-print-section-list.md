# 16: Print section list

**What to build:** On Sections to register, a "Print" button with a printer icon sits next to "Copy section list". It prints the existing print layout. It uses the normal secondary button border, not the warm border in the PNG, by decision.

Parent: [00-spec](00-spec.md), user story 51. Screen: `div.app-22`.

**Blocked by:** None (can start immediately).

**Status:** implemented

## Needs from lead
None. It uses the existing secondary button and tokens.

## Acceptance criteria
- [x] **Component:** the Print button is its own small component and a real button with visible text "Print". The icon is hidden from assistive tech.
- [x] **Placement:** matches `div.app-22.md` (70 × 36).
- [x] **Printing:** pressing it opens the browser print dialog with the existing print layout.
- [x] **Vitest:** pressing it calls print (stubbed).
- [x] **Playwright at 1440 px:** a state 23 screenshot compared with the PNG. Note the border colour differs by decision.
- [x] **834 px:** not covered, an agreed exception.
- [x] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.

## Validation

Verified on October 22, 2026. The implementation and tests were already present in commit `ef0db89`; no application changes were needed.

`npm run lint`, `npm run test` (635 tests), `npm run build`, and `npx tsc --noEmit` in `apps/web` pass. The existing Print button Vitest test and production Playwright test in `e2e/print-section-list.spec.ts` pass. The browser test checks dimensions, placement, keyboard activation and the existing print layout. The print call is stubbed; the native dialog is not inspected.

Standards and spec reviews found no issues. The UI reviewer found no blocking issues. The fresh state 23 screenshot was compared with `docs/design/screens/div.app-22.png`, allowing the agreed secondary border and existing page differences:

- `apps/web/e2e/screenshots/print-section-list-state-23-1440.png`
- `apps/web/e2e/screenshots/print-section-list-print-1440.png`

Next.js reported a security advisory during validation. The build passed on retry; the installed version still needs a separate security upgrade.
