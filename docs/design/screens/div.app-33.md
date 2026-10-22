# 34 · Tutorial · Results and registration handoff

- PNG: `div.app-33.png` · Figma node `68:12374` (inside `section#state-34` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 04/06 · The guide points to the actual displayed sections and existing save path. Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- DEMO planner from [`div.app-23.md`](div.app-23.md), guide from [`div.app-29.md`](div.app-29.md). Only the differences are listed.

## Scenario
Guide step 5 of 5, the last step. DEMO 1001 with Alex Rivera as lecture professor and lab B01 locked. Three schedules fit. The guide explains how to compare schedules, read section IDs and reach Sections to register.

## Sidebar
- DEMO 1001 row with lock icon, "L01 · B01 · D01".

## Header
- **Switcher highlighted** (2px `--color-accent` outline, 4 outside): ‹ "Schedule 1 of 3" ›. Subtitle "1 course · 3 schedules fit". Save enabled.

## Preferences
Start · Any time · Block a time · Only open sections (on).

## Calendar
Same as state 24 (7:30 AM–4:30 PM, compact), with a lock icon on the selected B01 block.

## Details panel
Lecture professor ("Optional") **"Alex Rivera"** · Lecture L01 ("Lock", Alex Rivera 4.4 / 5, 27 ratings) · Lab B01 (**"Unlock"**, Sam Patel) · Discussion D01 ("Compatible", Riley Chen).

## Guide popover — step 5
- **330 wide** (wider than the 292 of steps 1–4), placed over the lower left of the calendar (x 274, y 472).
- "Getting started · 5 of 5"
- h2 **"Browse, inspect, then save if you like"** (two lines)
- Body **"Use the arrows to compare returned schedules. The course panel lists this timetable’s lecture, lab and discussion IDs. Save a plan to find Sections to register, where you can copy or print the codes for Workday."**
- Hint **"Saving and registering are not required to finish."**
- Back · Skip guide · **"Finish guide"** (primary, 100 × 34, check icon 16, focused).
- "Your choices stay in your plan."

## Data
- Finish guide is always enabled on this step, even with no schedule ([`div.app-34.md`](div.app-34.md)).
- Finish closes the guide, remembers that, and keeps the plan exactly as it is.
