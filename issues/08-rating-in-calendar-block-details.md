# 08: Rating in calendar block details

**What to build:** A student browsing the calendar can hover or focus a lecture block and see that lecture's instructors with their rating ("x.x / 5 · n ratings" or "— / 5 · Rating unavailable") in the block's details. It reuses the rating row from ticket 07. The block faces stay as drawn.

Parent: [00-spec](00-spec.md), user story 18.

**Blocked by:** 07 (Course panel v2 order with lecture ratings).

**Status:** ready-for-agent

## Needs from lead
None. It uses the rating data type from 07.

## Acceptance criteria
- [ ] **Where it shows:** lecture block details show one rating row per instructor. Labs, discussions and blocked times show none.
- [ ] **Block faces:** unchanged, with no rating on the face.
- [ ] **Keyboard:** focusing a block shows the same details as hovering it. Screen readers can reach the rating text.
- [ ] **Vitest:** details for a lecture with a rating, without one, and co-taught. No rating for a lab.
- [ ] **Playwright at 1440 px:** a screenshot of a hovered lecture block and a focused one, approved by the owner.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
