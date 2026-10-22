# 13: Step 1: choose a lecture time first

**What to build:** Under the lecture card, "{n} other lecture times · Unlocked" (or "· Locked") opens a list of eligible lecture times, filtered by the chosen professor. Each row shows days, time and its instructors' ratings.
- **Choosing a lecture:** locks it and re-solves. Step 1 closes, step 2 opens and gets focus, and a live region says "Lecture {section} locked · {n} schedules fit".
- **Switching:** after a lecture is locked, choosing another lecture moves the lock.
- **Locked lab:** lectures that don't fit it are disabled, with "Doesn't fit locked lab {section}". The lab is never unlocked automatically.
- **Unlocking:** going back to step 1 happens when the lecture is unlocked.
- **One lecture:** a course with one lecture shows "Only lecture" and counts step 1 as done.
- **No lectures:** step 1 is hidden.

Parent: [00-spec](00-spec.md), user stories 19, 21–24, 28–31, 36, 37. Screens: `div.app-24` / `div.app-25` (closed state), `div.app-20` (open layout to copy).

**Blocked by:** 12 (Step 2: choose a lab that fits).

**Status:** ready-for-agent

## Needs from lead
None. This uses the existing lock and option-swap actions, and no new store state.

## Acceptance criteria
- [ ] **Step logic:** the helper from 12 gains eligible lectures (after the professor filter), the locked/unlocked label, the "Only lecture" case, and disabled lectures with their reason.
- [ ] **Small components, one per file:** the lecture time list and the lecture time row, which reuses the rating row from 07.
- [ ] **Focus while solving:** after choosing, focus waits on the step 2 disclosure, which is `aria-disabled` until solving finishes.
- [ ] **Disabled rows:** use `aria-disabled` and `aria-describedby` pointing at the reason.
- [ ] **Look:** the open list copies state 21's layout with lecture cards. You approve it from a screenshot because it isn't in Figma.
- [ ] **Vitest:** the helper's rules; choosing locks and moves focus; the live region text; switching moves the lock; disabled rows; unlocking returns to step 1; locks never dropped.
- [ ] **Playwright at 1440 px:** an approval screenshot of step 1 open, and a real-engine flow:
  1. pick a lecture and check the count drops;
  2. pick a lab that fits in step 2;
  3. switch lecture with a locked lab and see the disabled rows;

  all with the keyboard only.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
