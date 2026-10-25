# 04: Sort menu with six orders

**Track:** PREFS

**What to build:** A student opens the Sort menu at the end of the Preferences row and picks one of six orders: Best overall, Fewest early classes, Latest start, Earliest finish, Most days off or Most compact. The schedules re-rank in the engine and the switcher jumps to schedule 1. The order is still picked after a reload, and it's saved with a plan. Everything works with the keyboard only and on an 834 px tablet.

**Blocked by:** 01 (presets), 02 (engine late minutes), 03 (listbox menu trigger).

**Status:** DONE

- [ ] The Sort control uses the shared listbox's menu trigger, labeled "Sort". It lists all six presets in table order, with labels exactly as in the brief.
- [ ] The helper that filtered the menu to "orders a design shows" is deleted; nothing filters anymore.
- [ ] Picking an order sets the preset in the store, re-solves, and shows schedule 1.
- [ ] The Sort control stays hidden when only one schedule fits, as today.
- [ ] The order survives a page reload and a save-and-open. The read-only view of a saved plan shows the preset's current label.
- [ ] Tab order: Sort is the last stop in the Preferences row.
- [ ] 1440 px: the Preferences row fits on one line with Sort right-aligned, matching `div.app-6`. The list opens below, right-aligned inside the window.
- [ ] 834 px:
  - the Preferences row wraps; Sort stays last, right-aligned, and is never narrower than 146;
  - the list flips or shifts to stay at least 8 px inside the window;
  - the page never scrolls sideways.
- [ ] Real-data check: run each preset on a few B-Term 2026 course sets and confirm the top schedule matches its label (for example, the Latest start top schedule doesn't begin at 8 AM if a later option exists). If a preset's numbers need tuning, change them in the preset table and keep the tie-break test green.
- [ ] Its own Playwright spec, against the production build:
  - picking each order changes the ranking and resets to schedule 1;
  - keyboard only: open with Enter, type "L" to reach Latest start, pick it with Enter, and focus returns to the control;
  - the order persists across a reload;
  - no sideways scroll at 834 px.
- [ ] Screenshots of the closed and open Sort control at 1440 and 834 px. The closed control matches `div.app-6`.
- [ ] `npm run lint`, `npm run test` and `npm run build` pass.
