# Design reference

[GoatPlan in Figma, "Prototype v2."](https://www.figma.com/design/wKCRpXUKVwygCL5vn7F05W/GoatPlan?node-id=68-16206) · [whole file](https://www.figma.com/design/wKCRpXUKVwygCL5vn7F05W/GoatPlan?node-id=0-1&p=f&t=oGsmlalhHmS6qorE-0)

Prototype v2 is the current design. "Prototype v1." is still in the file for reference. Each PNG in `screens/` has a note with the same name (`div.app-3.png` → `div.app-3.md`). Colors and type in the notes use the CSS variables in [`tokens.md`](tokens.md).

## Screens

| PNG and note | State | What it shows |
|---|---|---|
| `div.app` | 01 | First visit, empty. Also the app shell reference |
| `div.app-1` | 02 | Loading term data |
| `div.app-2` | 03 | Data failed to load |
| `div.app-3` | 04 | Search results, fit badges. Planner parts and course panel reference |
| `div.app-4` | 05 | Search, no results; locked lab |
| `div.app-5` | 06 | Course not offered this term |
| `div.app-6` | 07 | One / many schedules, the regular planner |
| `div.app-7` | 08 | No schedule fits: course clash |
| `div.app-8` | 09 | No schedule fits: start time |
| `div.app-9` | 10 | No schedule fits: full section locked |
| `div.app-10` | 11 | One course can't fit, others schedule |
| `div.app-11` | 12 | All sections full |
| `div.app-12` | 13 | Saved vs. unsaved |
| `div.app-13` | 14 | Online, no set time |
| `div.app-14` | 15 | Instructor not assigned |
| `div.app-15` | 16 | Waitlist-only section |
| `div.app-16` | 17 | Seat count changed since saving |
| `div.app-17` | 18 | Evening and weekend, calendar expands |
| `div.app-18` | 19 | Long course titles |
| `div.app-19` | 20 | Hover and selected block |
| `div.app-20` | 21 | Previewing an alternative |
| `div.app-21` | 22 | Locked section, regular planner |
| `div.app-22` | 23 | Sections to register |
| `div.app-23` | 24 | Fresh plan, Any time |
| `div.app-24` | 25 | Lecture professor picker open |
| `div.app-25` | 26 | Lecture professor with co-teaching |
| `div.app-26` | 27 | Professor and locked lecture conflict |
| `div.app-27` | 28 | Saved professor no longer available |
| `div.app-28` | 29 | Course without lectures |
| `div.app-29` | 30 | Guide step 1: wait for term data. Guide reference |
| `div.app-30` | 31 | Guide step 2: add a course |
| `div.app-31` | 32 | Guide step 3: optional lecture professor |
| `div.app-32` | 33 | Guide step 4: keep current availability |
| `div.app-33` | 34 | Guide step 5: results and registration |
| `div.app-34` | 35 | Guide step 5 with no matches |
| `div.app-35` | 36 | Returning visit, choices restored |
| `div.app-36` | 37 | Guide storage unavailable |

States 01–03 and 06 are not in Prototype v2; their PNGs and notes are from v1. Notes for 04–23 were updated to v2.

Not exported yet: state 38 "Search incomplete · Found schedules only" and the 834 px tablet states 39–45 (course validation, optional availability, professor rating and section details as a side drawer, finish with no matches, optional professor, wait for term data, results handoff). They are in Figma under "Prototype v2." (state 38 node `68:13884`, tablet frames 834 × 840 from node `68:14227`).

## Phone screens (375 px)

The phone layout has no Figma frame. The implementation and these notes are the
reference. Screenshots are taken at 375 × 812 px. The phone breakpoint is
below 40 rem (640 px); from 640 px up every screen looks exactly as the
desktop/tablet designs above.

| Note | What it shows |
|---|---|
| [`phone-planner-empty`](screens/phone-planner-empty.md) | First visit, empty planner. Phone shell reference: single column, "Your courses" disclosure open, day calendar with no classes, stacked preferences. |
| [`phone-planner-courses`](screens/phone-planner-courses.md) | Planner with courses and schedules. Day view with class blocks, free-time dividers, schedule switcher with wrapping badges, collapsed disclosure. |
| [`phone-details-sheet`](screens/phone-details-sheet.md) | Course details in a bottom sheet. Full-width, ≤ 85 dvh, slide-up, same content as the desktop side panel. |
| [`phone-preferences`](screens/phone-preferences.md) | Preferences bar stacked, icon-only header actions, "Block a time" in a bottom sheet, guide popover adaptation, "Your courses" disclosure behavior. |
| [`phone-plans`](screens/phone-plans.md) | Sections to register on `/plans`. Section cards (label–value rows) replace the desktop table; full-width action buttons. |

These notes cover the phone adaptations. Desktop state notes (01–37 above) describe the shared content and data; the phone notes describe only the layout differences.

## What changed in v2

- **Wider course panel**: 284 instead of 270. The calendar shrinks from 1134 to 1120.
- **Course panel order**: Lecture professor filter first (label, select, hint "Filters lectures only…"), then "Sections in this schedule". See [`div.app-3.md`](screens/div.app-3.md).
- **Ratings** sit in the lecture card: instructor, star and "{score} / 5", rating count or "Rating unavailable", and the Rate My Professors link.
- **Compact lab and discussion cards** with a "Compatible" badge for courses that have both ([`div.app-23.md`](screens/div.app-23.md)).
- **Print** button on Sections to register ([`div.app-22.md`](screens/div.app-22.md)).
- **First-plan guide** is now a five-step popover next to the control it explains, instead of a banner above the app.
- New colors and shadows for the guide, the professor list, the unavailable professor and the success banner: see "Added in Prototype v2" in [`tokens.md`](tokens.md).

## First plan guide

The guide has five steps: choose a term, add courses, optional lecture professor, keep or change availability, then browse, inspect and save. The reference is [`div.app-29.md`](screens/div.app-29.md); each step has its own note (states 30–35).

- A popover floats next to the real control and never covers it. The control gets a 2px accent outline and stays usable. There are no copies of planner controls inside the guide.
- Next waits for a loaded term (step 1) and for at least one course (step 2). Steps 3–5 never block. Finish guide is always available on step 5, even with no matches.
- Back, Next, Skip guide, Close guide and Finish guide never change the plan, the preferences or the locks. "Your choices stay in your plan." sits under every step.
- Step 3 targets the selected course's Lecture professor, or the first planned course with lectures. It is skipped when no planned course has lectures.
- Skip, Close and Finish remember in this browser that the guide is done ([`div.app-35.md`](screens/div.app-35.md)). If storage fails, an info banner says the guide may come back next visit ([`div.app-36.md`](screens/div.app-36.md)).

## New plans

A new draft starts with **Start · Any time**, no blocked times, and Only open sections on ([`div.app-23.md`](screens/div.app-23.md)). Any time uses `startsAfter: 0`, leaves early classes eligible and shows no early band. Once a time is picked, the pill reads "Starts after {time}". Results update automatically.

Screens with a 9:00 AM preference show configured plans, not defaults.

Reloading a draft, opening a saved plan, saving, or saving as a new plan keeps the current settings. A term without a stored draft uses the defaults.

## Lecture professors

Any professor is the default. List instructors from lecture sections only, including co-teachers ([`div.app-24.md`](screens/div.app-24.md)). Hide the filter when the course has no lectures ([`div.app-28.md`](screens/div.app-28.md)). Individual section choices stay available.

Selecting a professor keeps all lectures they teach. Labs and discussions can have other instructors, and lab locks stay ([`div.app-25.md`](screens/div.app-25.md)). The same rule applies to the section-choice sheet and diagnosis previews. Clearing the choice keeps the current availability settings.

When a professor and a lecture lock conflict, show no schedule and relax neither. The calendar shows "No matching timetable" and the panel offers "Clear professor" and "Unlock {section}" ([`div.app-26.md`](screens/div.app-26.md)).

A restored professor without eligible lectures stays in the select with an "Unavailable" badge until the student clears it. The panel offers "Clear unavailable professor" and keeps locks and preferences ([`div.app-27.md`](screens/div.app-27.md)).
