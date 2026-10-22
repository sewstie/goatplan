# 09: Lecture professor listbox

**What to build:** The Lecture professor choice opens the custom list from state 25:
- "Any professor" ("All {n} lecture times") comes first, then each lecture instructor with "{n} lecture time(s)" and " · includes co-teaching" where it applies.
- The selection has the accent-soft fill and a check.
- It works fully from the keyboard and with a screen reader.

Parent: [00-spec](00-spec.md), user stories 4, 5, 8, 9. Screens: `div.app-24`, `div.app-25`.

**Blocked by:** 07 (Course panel v2 order with lecture ratings).

**Status:** ready-for-agent

## Needs from lead
- **Listbox primitive:** a new UI listbox following the WAI-ARIA select-only combobox pattern, so the Sort menu can use it later too.
- **Tokens:** add the listbox line colour and listbox shadow, from "Added in Prototype v2" in `tokens.md`.
- **Data helper:** returns lecture instructors with their lecture-time counts, with co-teachers counted for each name.

## Acceptance criteria
- [ ] **Structure:**
  - **Button:** `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant`, labelled "Lecture professor".
  - **Popup:** `role="listbox"` with `role="option"` rows carrying `aria-selected`.
- [ ] **Keys:** Enter, Space, Alt+↓ or ↓ opens it. ↑/↓ moves, Home/End jump, and typing jumps to a name. Enter or Space picks. Esc closes and returns focus. Tab and clicking outside close it.
- [ ] **Behavior:** "Any professor" clears the choice. Picking a professor keeps all their lectures, including co-taught ones. Preferences and locks are untouched.
- [ ] **Looks:** match the spacing and copy in `div.app-24.md`, using the new tokens and no hex values.
- [ ] **Vitest:** the full keyboard model and ARIA attributes, focus returning on Esc, the counts and co-teaching note, and that "Any professor" means no choice.
- [ ] **Playwright at 1440 px:** a state 25 screenshot with the list open, compared with the PNG, plus state 26. Note that the state 25 sidebar lock icon differs by decision. Also a keyboard-only run that picks a professor with the real engine.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
