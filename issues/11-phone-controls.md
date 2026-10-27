# 11: Phone controls: preferences, switcher, header actions

Ticket: 11
Wave: 3
Status: DONE
Blocked By: 10

**Track:** prefs (Preferences row), schedule (switcher, badges), plans (header actions)

**What to build:** On a phone the student can change the sort and preferences, block a time, switch schedules, and save or open plans with a thumb. Everything fits and nothing scrolls sideways.

- [ ] Preferences wrap below 640 px: Sort and "Starts after" each get a full row, and the toggles share one. Listboxes open full width under the control, 16 px from the screen edges.
- [ ] "Block a time" opens its form in the bottom Sheet on phone, and as today on 834 px and up.
- [ ] The switcher is one row, "‹ Schedule 3 of 200 ›". The badges wrap under it as whole pills, 4 px apart vertically and 8 px horizontally. The banner and the saved-plan switcher wrap the same way.
- [ ] Save, Saved plans and Sections to register stay in the header row. Labels that don't fit become icon buttons with the same accessible name and a tooltip on hover or focus. The title may wrap.
- [ ] Every control here is at least 44 × 44 px on phone, using an invisible hit area where the look is smaller. The sizes at 834 and 1440 px don't change.
- [ ] Tokens only, DM Sans, existing focus ring, hover only on pointer devices.
- [ ] Phone browser spec, by touch:
  - change sort;
  - set "Starts after";
  - block a time and remove it;
  - next and previous schedule;
  - save a plan and open Saved plans.
  - No sideways scroll throughout.
