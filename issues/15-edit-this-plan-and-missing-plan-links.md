# 15: Edit this plan, and links to missing plans

**What to build:**
- **Edit this plan:** in Saved mode, "Edit this plan" (a primary button the size of Save) takes Save's place. Pressing it opens the plan for real as the working draft. If the draft has unsaved changes, it asks first with the existing confirmation, and switches to Found after opening.
- **Missing plans:** opening `?view=saved&plan={id}` for a plan this browser doesn't have shows the existing "plan not found" message and returns to Found.

Parent: [00-spec](00-spec.md), user stories 42, 43, 47.

**Blocked by:** 14 (Found | Saved view in the URL).

**Status:** ready-for-agent

## Needs from lead
None beyond 14. It uses the existing open-plan action.

## Acceptance criteria
- [ ] **Component:** the Edit this plan button is its own small component, shown only in Saved mode.
- [ ] **Opening:** with no unsaved changes, it opens straight away. With unsaved changes, it asks first, and Cancel keeps both the draft and Saved mode.
- [ ] **Focus:** after opening, focus moves to a sensible place (the switcher), and the live region announces it.
- [ ] **Unknown id:** shows "plan not found", switches back to Found, and cleans the URL.
- [ ] **Vitest:** both opening paths, Cancel, and the unknown-id fallback.
- [ ] **Playwright at 1440 px:** an approval screenshot of the Saved header with Edit this plan. Flows: edit with unsaved changes, and open a link to a missing plan.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
