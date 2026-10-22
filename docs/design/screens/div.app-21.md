# 22 · Locked section · Regular planner

- PNG: `div.app-21.png` · Figma node `68:8661` (inside `section#state-22` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "One schedule fits. The lab has a lock icon and Unlock; CL01 reads Only lecture." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)) with a locked lab ([`div.app-4.md`](div.app-4.md)). No Figma call: every part is already covered.

## Scenario
The everyday locked state: three courses, AE 2320's lab CX02 locked, exactly one schedule fits, AE 2320 selected.

## What's on screen
- **Sidebar**: "Your courses" · "3 selected". AE 2320 (selected, **lock icon** after the code, "CL01 · Lab CX02"), AE 2410 ("C01"), AE 2210 ("C01").
- **Header**: single pill **"Schedule 1 of 1"** (no arrows), subtitle **"3 courses · 1 schedule fits"**, "Saved plans ⌄", Save schedule **enabled**.
- **Preferences**: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM (×) · Block a time · Only open sections (on). No Sort, no strip.
- **Calendar**: 8:30 AM–4:30 PM, **regular** block size (≈67 px/h, with room line), early band "No classes before 9:00 AM", Work Tue/Fri 2–4 PM.
  - AE 2320 CL01 Mon–Fri 9:00–9:50 AM (dark) · AE 2410 C01 Mon–Fri 10:00–10:50 AM (peach) · AE 2210 C01 Mon–Fri 11:00–11:50 AM (yellow).
  - AE 2320 CX02 Thu 3:00–3:50 PM: **selected** style with **lock icon 10** before the code.
- **Details panel**: "AE 2320", "Introduction to Orbital Mechanics", Lecture professor **"Ye Lu"** with its hint, then "Sections in this schedule":
  - Lecture CL01 + neutral badge **"Only lecture"** · "Mon–Fri · 9:00 AM–9:50 AM" · "Unity Hall 400" · "36 of 120 seats open" · instructor block: "Ye Lu" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md)).
  - Lab CX02 + small accent button **"Unlock"** · "Thu · 3:00 PM–3:50 PM" · "Higgins Labs 230" · "4 of 40 seats open" · "Ye Lu".
  - "View other lab choices ⌄".

## Lock rules shown
- A locked section shows a lock icon in three places: after the course code in the sidebar row, before the code in its calendar block, and as "Unlock" in its section card.
- An unlocked section with alternatives shows "Lock". A section with no alternatives shows the "Only lecture" badge and can't be locked.

## Data
- `preferences.locked = { "AE 2320": ["AE 2320-CX02"] }`.
- "Only lecture": the course has a single lecture section.
