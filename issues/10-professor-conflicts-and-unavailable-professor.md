# 10: Professor conflicts and unavailable professor

**What to build:**
- **Conflict:** when the chosen professor and a locked lecture can't both hold, the calendar shows "No matching timetable", and the panel offers "Clear professor" and "Unlock {section}". Nothing is relaxed automatically.
- **Unavailable professor:** when a restored professor no longer teaches any lecture, their name stays in the listbox with an "Unavailable" badge, and the panel offers "Clear unavailable professor". Clearing keeps every lock and preference.

Parent: [00-spec](00-spec.md), user stories 10–12. Screens: `div.app-26`, `div.app-27`.

**Blocked by:** 09 (Lecture professor listbox).

**Status:** ready-for-agent

## Needs from lead
- **Tokens:** add the unavailable surface and line colours.
- **Badge:** an `unavailable` tone.
- **Store:** an action that clears an unavailable professor while keeping locks and preferences, if the existing professor action can't do this as is.

## Acceptance criteria
- [ ] **Empty calendar:** a "No matching timetable" message card with the exact copy from `div.app-26.md`.
- [ ] **Fixes:** "Clear professor" and "Unlock {section}" each change only their own choice, then re-solve.
- [ ] **Badge:** the unavailable professor badge is its own small component, shown in the listbox field.
- [ ] **Recovery:** "Clear unavailable professor" restores results without touching locks or preferences.
- [ ] **Vitest:** the conflict state and both fixes; the unavailable restore and clearing it; locks and preferences unchanged after each.
- [ ] **Playwright at 1440 px:** states 27 and 28 compared with the PNGs. Keyboard-only recovery from each, with the real engine.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
