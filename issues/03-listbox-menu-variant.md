# 03: Shared listbox: menu-style trigger

**Track:** SHARED (lead: UI primitives)

**What to build:** The shared listbox, the dropdown behind the professor picker, can also look like the small "Sort ⌄" control in the design. The open list stays the same as the professor list. Moving the pointer over an option highlights it, the same way the arrow keys do. The menu-style control is easy to tap on a tablet. The professor picker looks the same as before and only gains the hover highlight.

**Blocked by:** 02 (engine before UI).

**Status:** ready-for-agent

- [ ] The listbox takes one new prop, a trigger variant: `"field"` (today's look, the default) or `"menu"`. It uses the same names as the shared select's variants.
- [ ] The menu trigger matches the closed Sort control in `div.app-6`:
  - surface fill, row radius, minimum width 146, padding 7.5 / 9, gap 6;
  - the label ("Sort") in muted ink, then the current option's label in ink, at 9 px;
  - a 10 px caret-down.
- [ ] The list is at least as wide as the trigger and wide enough for the longest label without cutting it off. It uses the listbox border, shadow, radius and padding tokens it already has.
- [ ] Highlight and selection:
  - pointer hover and the arrow keys move the same single highlight (surface-selected);
  - the picked option keeps its soft accent fill and check icon even when highlighted.
- [ ] Focus look:
  - the menu variant uses the button focus ring: a 2 px outline in the focus color, 2 px from the control, shown only for keyboard focus;
  - the field variant keeps the field focus look;
  - the focus ring is never removed.
- [ ] No hover fill on the closed control, and no pressed state. The caret turns 180° while the list is open, with the transition turned off for reduced motion.
- [ ] The menu trigger's tap area is at least 44 px high, made with an invisible extended hit area, so the layout doesn't change.
- [ ] The keyboard behavior is unchanged and pinned by tests:
  - Enter, Space, ArrowDown and ArrowUp open the list;
  - arrows move without wrapping; Home and End jump to the ends;
  - type-ahead works, and repeating a letter cycles through matches;
  - Enter or Space picks; Escape closes without changing anything; Tab closes and moves on;
  - a click outside closes the list;
  - focus comes back to the trigger.
- [ ] Screen readers: the trigger is a combobox named by its label, with the current option as its text and an open/closed state. The list is a listbox with the selected option marked.
- [ ] Colors, sizes and shadows come only from theme tokens and CSS variables. There are no hex values and no new color tokens. The font is DM Sans.
- [ ] The listbox component tests cover:
  - both variants;
  - every key above;
  - hover moving the highlight;
  - roles and names.

  The professor picker's existing tests and e2e snapshots still pass.
- [ ] `npm run lint`, `npm run test` and `npm run build` pass.
