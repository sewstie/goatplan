# 12: Step 2: choose a lab that fits

**What to build:** Under a lab or discussion card, "View other lab choices" opens an inline "Other lab choices" list in the panel, as in state 21:
- **What's listed:** only the labs or discussions that fit the current lecture, without the current one.
- **Choosing:** locks that section and re-solves.
- **Preview:** hovering or focusing a row previews it on the calendar.
- **Closing:** Esc closes the list.
- **Lab and discussion:** a course with both opens each list from its own card.
- **The sheet:** the panel no longer opens the "Choose a lab" sheet. It stays only for picks made from the calendar.

Parent: [00-spec](00-spec.md), user stories 25–27, 32–35. Screen: `div.app-20`.

**Blocked by:** 07 (Course panel v2 order with lecture ratings).

**Status:** ready-for-agent

## Needs from lead
- **Badge:** a `previewing` tone, if the existing tones can't show "Previewing".
- **Tokens:** none new. Rows reuse the compact card spacing.

## Acceptance criteria
- [ ] **Step logic:** a pure, tested helper works out the current step from locks, the labs or discussions that fit, the exclusion of the current one, and when step 2 is hidden (no labs or discussions). A hook exposes it to components.
- [ ] **Small components, one per file:** the step disclosure, the lab choice list, the lab choice row.
- [ ] **Disclosure:** a button with `aria-expanded` and `aria-controls`. Rows are a list of "Choose {section}" buttons reached with Tab. Esc closes and returns focus to the disclosure.
- [ ] **After choosing:** the lab is locked and focus moves to that card's Unlock button.
- [ ] **Previews:** start on hover or focus and end on blur or mouse-leave.
- [ ] **Locks:** existing locks are never removed.
- [ ] **Vitest:** the helper's rules; choosing locks; focus movement; Esc; previews; a lab and discussion each opening their own list.
- [ ] **Playwright at 1440 px:** state 21 compared with the PNG. A real-engine flow: open, preview, choose with the keyboard, check the lock and that the count changed.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
