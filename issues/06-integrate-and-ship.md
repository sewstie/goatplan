# 06: Integrate and ship

**Track:** LEAD

**What to build:** Sorting and badges work together on `feature/sorting`. Picking an order re-ranks the schedules and its badge leads the top schedule. The branch passes every check and goes to `main` as one PR.

**Blocked by:** 04 (sort menu), 05 (badges).

**Status:** ready-for-agent

- [ ] Ticket branches 01–05 are merged into `feature/sorting` in wave order, with no conflicts left unresolved.
- [ ] A cross-feature Playwright spec:
  - picking Earliest finish makes "Done by …" the first badge;
  - picking Most days off makes the days-off badge first;
  - after save-and-open, the plan shows the same order.
- [ ] Screenshots at 1440 and 834 px of the planner with the Sort list open and with badges. The closed Sort control matches `div.app-6`. There are no PNGs yet for the open list and the badges; this is noted in the PR.
- [ ] `npm run lint`, `npm run test` and `npm run build` pass. The engine tests pass. A fresh WebAssembly build matches the committed one.
- [ ] The ui-reviewer agent finds no blocking issues.
- [ ] One PR from `feature/sorting` to `main`. It lists the engine commit separately and notes that the engine API stays version 1, with additive fields only.
