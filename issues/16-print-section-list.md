# 16: Print section list

**What to build:** On Sections to register, a "Print" button with a printer icon sits next to "Copy section list". It prints the existing print layout. It uses the normal secondary button border, not the warm border in the PNG, by decision.

Parent: [00-spec](00-spec.md), user story 51. Screen: `div.app-22`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Needs from lead
None. It uses the existing secondary button and tokens.

## Acceptance criteria
- [ ] **Component:** the Print button is its own small component and a real button with visible text "Print". The icon is hidden from assistive tech.
- [ ] **Placement:** matches `div.app-22.md` (70 × 36).
- [ ] **Printing:** pressing it opens the browser print dialog with the existing print layout.
- [ ] **Vitest:** pressing it calls print (stubbed).
- [ ] **Playwright at 1440 px:** a state 23 screenshot compared with the PNG. Note the border colour differs by decision.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
