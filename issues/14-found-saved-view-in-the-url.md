# 14: Found | Saved view in the URL

**What to build:**
- **Toggle:** a Found | Saved toggle sits next to the schedule switcher. Found works as today, with ‹ "Schedule N of M" ›.
- **Saved mode:** shows ‹ "Saved plan N of M · {name}" › and pages through this term's saved plans view-only:
  - the calendar, panel and preferences show the saved plan read-only, including ratings;
  - planner controls that would change the plan are disabled or hidden;
  - the working draft is untouched.
- **Switching back:** going back to Found shows the draft exactly as it was.
- **URL:** the view is `/?view=saved&plan={id}`, so reload, back and bookmarks keep it.
- **Empty term:** Saved is disabled when the term has no saved plans.

Parent: [00-spec](00-spec.md), user stories 20, 38–41, 44–46, 48–50. Header reference: `div.app-6`, `div.app-12`, `div.app-35`. No design exists for the new parts.

**Blocked by:** 07 (Course panel v2 order with lecture ratings).

**Status:** ready-for-agent

## Needs from lead
- **Store:** a saved view state that follows the URL (`view=saved&plan={id}`; none means Found), with show-found, show-saved, next and previous saved actions. It isn't saved with the draft. URL handling lives in one lead-owned place.
- **Selector:** returns the schedule being viewed (the current found schedule or the saved plan's schedule). The calendar and panel read only that.
- **Reserved name:** `share=` for later.

## Acceptance criteria
- [ ] **Small components, one per file:** the schedule source toggle and the saved plan switcher.
- [ ] **Toggle:** two `aria-pressed` buttons in `role="group"`, labelled "Schedule source". Focus stays on the pressed button. A polite live region says "Showing saved plans" or "Showing found schedules".
- [ ] **Saved switcher:** "Previous saved plan" and "Next saved plan" icon buttons that don't wrap and are disabled at the ends. The plan label is in a polite live region. Long names are cut off with "…", and the full name is in the accessible name.
- [ ] **Saved disabled:** has a tooltip and `aria-describedby` reading "No saved plans for this term yet".
- [ ] **Looks:** built from existing header parts and tokens only:
  - pills in the "Schedule N of M" style, with accent-soft for the active one;
  - the switcher's arrows.

  You approve it from screenshots.
- [ ] **Vitest:** the toggle and switcher behavior and ARIA; Saved mode never changes the draft; the viewed-schedule selector; disabled with no saved plans.
- [ ] **Playwright at 1440 px:**
  - **Screenshots for approval:** the Found and Saved headers.
  - **Flow:** page through saved plans, reload on the URL, use the back button, switch to Found and check the draft is unchanged.
  - **Keyboard:** a keyboard-only run.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
