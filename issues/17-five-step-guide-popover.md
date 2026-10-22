# 17: Five-step guide popover

**What to build:** A first-time student sees the v2 guide, which replaces the four-step banner. It is a popover next to the real control, never covering it. The control gets a 2px accent outline and stays usable.
- **Steps:**
  1. Term.
  2. Add a course.
  3. Optional lecture professor.
  4. Keep or change availability.
  5. Browse, inspect and save.
- **Blocking:** Next waits for a loaded term and for one course. Steps 3–5 never block.
- **Step 3:** points at the selected course's Lecture professor, or else the first course with lectures. It is skipped when no course has lectures, and the progress line then counts only the steps shown.
- **Step 5:** 330 px wide, with Finish guide always available. It shows the no-match text only when the engine returns zero schedules.
- **Safety:** no guide button changes the plan.
- **Copy:** v2 word for word. The guide never targets Saved-mode controls.

Parent: [00-spec](00-spec.md), user stories 54–60. Screens: `div.app-29` (reference) to `div.app-34`.

**Blocked by:** 07 (Course panel v2 order with lecture ratings).

**Status:** ready-for-agent

## Needs from lead
The guide folder is lead-owned, so the lead does this ticket or hands it over.
- **Tokens:** add the guide line colour, guide hint colour, guide shadow and radius 15.
- **Page:** mount the popover layer in place of the banner slot above the app.

## Acceptance criteria
- [ ] **Small pieces, one per file:** the popover, the guide buttons, the target outline, a placement helper and a steps helper. The old copied-control step components are removed.
- [ ] **Popover:**
  - **Role:** a non-modal `role="dialog"`, labelled by its heading and described by its body. It doesn't trap focus.
  - **Focus:** goes to the heading on each step, and to Finish guide on step 5.
  - **Esc:** acts like Skip guide.
- [ ] **Progress and Next:** the progress line is in a polite live region, and its total only changes when moving to another step. A waiting Next is `aria-disabled`, stays focusable, and gives its reason.
- [ ] **Remembering:** Skip, Close and Finish remember in this browser that the guide is done. A stored flag means no guide.
- [ ] **Vitest:**
  - **Placement:** never overlaps the target and stays in the viewport at 1440.
  - **Step rules:** step 3 targeting and skipping; the progress count.
  - **Next and finish:** Next is blocked only on steps 1 and 2; the no-match text only for zero results.
  - **Safety:** no button changes courses, preferences, locks or the professor.
  - **Focus:** placement on each step.
- [ ] **Playwright at 1440 px:** states 30–35 compared with the PNGs. Note that step 5's DEMO colours differ by decision. A keyboard-only run of the whole guide with the real engine. Replace the v1 tutorial screenshots.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
