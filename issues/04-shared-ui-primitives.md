# 04: Shared UI primitives and Sort option names

Ticket: 04
Wave: 1
Status: DONE
Blocked By: none

**Track:** SHARED (lead: UI primitives, global CSS)

**What to build:** Screen readers announce each Sort option by its label, with its description as extra detail, and tests select sorts by name. The pieces the phone layout and Undo need also land here, so later tickets don't edit shared files: a Toast, a bottom Sheet and the phone breakpoint. Runs in parallel with 01 and 02.

- [x] **Listbox:** each option is named by its label only and described by its description. The check icon stays hidden. The professor picker gets the same fix. No visual change.
- [x] The shared e2e sort helper selects options by role and name, and the existing sort specs use it.
- [x] **Toast:** shows one message with one action button.
  - It runs for 6 seconds, pauses while the pointer is over it or focus is inside it, then resumes with the time left. When time runs out it calls its dismiss handler, and a new message restarts the timer.
  - It's a polite status region. Focus never moves to it on its own.
  - Look, tokens only: surface fill, popover border and shadow, card radius, ink text at 11 px / 570, the action in accent at 650, padding 10 / 14, gap 12.
  - Placement: bottom centre 16 px from the edge on 834 px and up; full width minus 16 px per side on phone.
  - Motion: a short fade and 8 px slide, none for reduced motion.
- [x] **Sheet:** a `side` option, right (today's default) or bottom.
  - Bottom is full width, at most 85 % of the screen height, has top corners at the panel radius and scrolls inside.
  - Focus moves to the heading on open and stays inside. Escape, Close and tapping the backdrop close it, and focus returns to what opened it.
  - The slide-in is turned off for reduced motion.
- [x] **Breakpoint:** a `tablet` theme breakpoint at 40rem (640 px). Nothing uses it yet, and every screen at 834 and 1440 px looks exactly as before.
- [x] Colors only from theme tokens and CSS variables, no hex values, no new color tokens. DM Sans.
- [x] The `/dev/ui` page shows the Toast and the bottom Sheet.
- [x] Component tests:
  - option names and descriptions;
  - Toast timer, pause on hover and on focus, status role, action by keyboard;
  - bottom Sheet focus trap and return, Escape, backdrop.
  - The existing listbox and select tests still pass.
