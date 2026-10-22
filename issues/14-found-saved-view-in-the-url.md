# 14: Found | Saved view in the URL

**What to build:**
- **Header:** use the existing Saved plans dropdown. Keep the schedule switcher next to the title. Remove the Found | Saved buttons and separate saved or unsaved changes text.
- **Dropdown:** keep the saved-plan list, Save as a new plan and All saved plans. Remove Sections to register from this dropdown.
- **Save:** show unsaved changes with the filled Save schedule button. Show saved changes with a soft Saved button and a check.
- **Saved plans page:** put Back to planner at the top right, in place of the save controls.
- **Saved mode:** shows ‹ "Saved plan N of M · {name}" › and pages through this term's saved plans view-only:
  - the calendar, panel and preferences show the saved plan read-only, including ratings;
  - planner controls that would change the plan are disabled or hidden;
  - the working draft is untouched.
- **Switching back:** browser Back restores the working draft. Opening a plan from the dropdown enters the editable planner.
- **URL:** the view is `/?view=saved&plan={id}`, so reload, back and bookmarks keep it.
- **Empty term:** the dropdown says that this term has no saved plans.

Parent: [00-spec](00-spec.md), user stories 20, 38–41, 44–46, 48–50. Header reference: `div.app-6`, `div.app-12`, `div.app-35`. No design exists for the new parts.

**Blocked by:** 07 (Course panel v2 order with lecture ratings).

**Status:** ready-for-agent

## Needs from lead
- **Store:** a saved view state that follows the URL (`view=saved&plan={id}`; none means Found), with show-found, show-saved, next and previous saved actions. It isn't saved with the draft. URL handling lives in one lead-owned place.
- **Selector:** returns the schedule being viewed (the current found schedule or the saved plan's schedule). The calendar and panel read only that.
- **Reserved name:** `share=` for later.

## Acceptance criteria
- [ ] **Small components, one per file:** the saved plan switcher and the existing header controls.
- [ ] **Header:** no source toggle or separate save-status text. The save button shows whether there are changes. All saved plans uses a Back to planner button at the top right.
- [ ] **Saved switcher:** "Previous saved plan" and "Next saved plan" icon buttons that don't wrap and are disabled at the ends. The plan label is in a polite live region. Long names are cut off with "…", and the full name is in the accessible name.
- [ ] **Dropdown:** the action list contains Save as a new plan and All saved plans. Empty terms show the existing no-saved-plans message.
- [ ] **Looks:** built from existing header parts and tokens only:
  - pills in the "Schedule N of M" style;
  - existing primary and soft save-button styles;
  - the switcher's arrows.

  You approve it from screenshots.
- [ ] **Vitest:** header and dropdown behavior and ARIA; Saved mode never changes the draft; the viewed-schedule selector; no plans for this term.
- [ ] **Playwright at 1440 px:**
  - **Screenshots for approval:** saved and unsaved planner buttons, the dropdown, and the saved-plans header.
  - **Flow:** page through saved plans, reload on the URL, use browser Back and check the draft is unchanged. Open All saved plans and return with Back to planner.
  - **Keyboard:** a keyboard-only run.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
