# 35 · Tutorial · Finish with no matches

- PNG: `div.app-34.png` · Figma node `68:12741` (inside `section#state-35` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 04/05/06 · Finish remains available. The guide never relaxes a preference to produce a result." · Static screen, no interactions.
- Start-time problem from [`div.app-8.md`](div.app-8.md), empty calendar from [`div.app-26.md`](div.app-26.md), guide from [`div.app-29.md`](div.app-29.md). Only the differences are listed.

## Scenario
Guide step 5 of 5. Starts after is set to 10:00 AM, but AE 2320's only lecture is at 9:00 AM, so nothing fits. The guide lets the student finish without changing anything.

## Sidebar
- "1 selected": AE 2320 (selected, lock icon), "CL01 · Lab CX02".

## Header
- Warning pill **"0 schedules fit"** with the target highlight (2px `--color-accent` outline, 4 outside, radius 12).
- Subtitle **"Your start-time choice is preserved."** Save disabled.

## Preferences
Starts after **10:00 AM** · Block a time · Only open sections (on). No blocked time.

## Calendar
Empty 8 AM–6 PM grid, caption "No matching schedule", message card "No matching timetable" / "Your choices are kept. Choose a fix in the course panel." No banner.

## Details panel — "Needs attention"
1. Kicker "Needs attention", h2 "AE 2320", title "Introduction to Orbital Mechanics" (12 below).
2. Issue box with warning icon 18: h3 **"Your start time excludes this lecture"** · body **"AE 2320’s only lecture starts at 9:00 AM, but Starts after is set to 10:00 AM."**
3. Lecture CL01 card ("Only lecture", Ye Lu, "— / 5", "Rating unavailable").
4. "Ways to fix it": primary **"Change to 9:00 AM"** (clock icon) · secondary **"Clear start restriction"**.

State 09 still uses different wording for the same problem ("Your start time is too late", "Remove AE 2320"). Confirm which wording wins before building.

## Guide popover — step 5, no matches
330 wide, at x 274, y 513.
- "Getting started · 5 of 5"
- h2 **"You can finish with no matches"**
- Body **"This lecture starts before your chosen time. Finish the guide whenever you’re ready, then use an explicit fix if you want to change that restriction."**
- Hint **"Finishing keeps every current preference and lock."**
- Back · Skip guide · **"Finish guide"** (focused).

## Data
- Use this step text when the engine returns `total: 0`. During loading or an error, show the regular step 5 text without schedule claims.
- Finish and Skip never apply a fix.
