# 12 · All sections full · Only open sections on

- PNG: `div.app-11.png` · Figma node `68:4033` (inside `section#state-12` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Hypothetical AE 2410 fill-up. Offer full sections or the Workday waitlist." · Static screen, no interactions.
- Same layout and components as [`div.app-7.md`](div.app-7.md) (state 08). No Figma call was made for this frame.

## Scenario
Three courses. Every AE 2410 section is full (hypothetical) and "Only open sections" is on, so nothing fits. AE 2320's lab CX02 is locked. AE 2410 is selected.

## Sidebar
- "Your courses" · "3 selected": AE 2320 (lock icon), **AE 2410 (selected, filled)**, AE 2210.

## Header
- Warning pill "0 schedules fit". Subtitle **"AE 2410 has no open sections."** Save schedule disabled.
- Preferences: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on). No Sort.

## Banner
**"Every AE 2410 section is full."** (700) + **" Only open sections excludes this course."** (400).

## Calendar
Looks like the regular planner: AE 2320 CL01 (dark), **AE 2410 C01 (normal peach, still drawn)**, AE 2210 C01 (yellow), AE 2320 CX02 Thu 3:00–3:50 PM (selected, lock icon), Work Tue/Fri, early band. The calendar keeps showing the last working schedule while nothing fits.

## Details panel — "Needs attention" (AE 2410)
1. Kicker "Needs attention", h2 **"AE 2410"**, title **"Introduction to Aerospace Structures"**.
2. Issue box:
   - h3 **"Every section is full"**
   - Body **"Every AE 2410 section is full. Show full sections, or join a waitlist in Workday."**
3. Section choice card (white): "Lecture C01" · "Only lecture" · "Mon–Fri · 10:00 AM–10:50 AM" · "Higgins Labs 116" · **"0 of 50 seats open"** · instructor block: "Mark Richman" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md)).
4. "Ways to fix it":
   - Primary **"Show full sections"** with the people icon 16.
   - Secondary **"Join waitlist in Workday"** with the external-link icon 16 (opens Workday in a new tab).

## Interactive states
- "Show full sections" turns off the "Only open sections" toggle.

## Data
- Engine: `total: 0`, `emptyCourses` = AE 2410 with `removed.notOpen` = all its options. "Show full sections" = fix `allowFull`.
- Workday link: external, not from the engine.
- Note the seats line has no " · Full" suffix here (state 10 has it). Treat that as a design inconsistency to confirm.
