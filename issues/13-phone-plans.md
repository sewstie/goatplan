# 13: Phone saved plans and Sections to register

Ticket: 13
Wave: 4
Status: DONE
Blocked By: 12

**Track:** plans

**What to build:** During registration week a student can open their saved plans on a phone and read "Sections to register" section by section, then copy, print or go to Workday, with no sideways scrolling.

- [ ] `/plans` below 640 px: one column, the plan list on top and the selected plan below. Its read-only calendar uses the day view from 12. From 640 px up it's unchanged.
- [ ] Sections to register below 640 px: one card per section, with label/value rows for course, section, CRN, days and time, room and instructor. Copy, Print and "Open Workday" sit above the cards as full-width buttons.
- [ ] Print output keeps the desktop table at every screen width.
- [ ] Touch targets are at least 44 px, using tokens only, the existing focus ring, and hover only on pointer devices.
- [ ] Phone browser spec:
  - no sideways scroll on `/plans` and Sections to register;
  - opening a plan by tap;
  - Copy puts the same text on the clipboard as on desktop;
  - the Workday link is present.
