# 19 · Long course titles

- PNG: `div.app-18.png` · Figma node `68:7190` (inside `section#state-19` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Calendar titles truncate with an ellipsis; the selected course panel retains the full title." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). One Figma call was made for a block (v1 node `30:17008`).

## Scenario
Three courses, one schedule, AE 2320 selected with lab CX02 locked. Blocks show the course title.

## Sidebar, header, preferences
- "3 selected": AE 2320 (selected, lock icon), AE 2410, AE 2210.
- Single pill "Schedule 1 of 1", subtitle "3 courses · 1 schedule fits", Save enabled.
- Preferences: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on). No Sort.

## Calendar — blocks with titles
- Range 8:30 AM–4:30 PM, regular hour height (≈67 px/h), early band, Work Tue/Fri.
- **Block with a title line** (`span.event-full-title`): padding 4 / 7, gap 3.
  1. Title row: code 10px / 700 / line-height 13 + section 8px / 400 / line-height 10.4 (gap 4).
  2. **Course title**: 8px / 400 / line-height 10.4, **one line, truncated with an ellipsis** (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`).
  3. Time: 8px / 400 / line-height 10.4.
  - **No room line** in this variant.
- Titles: "Introduction to Orbital Mechanics" (AE 2320 CL01 and CX02), "Introduction to Aerospace Structures", "Introduction to Thermal Engineering". They all fit at this width; the ellipsis applies when they don't.
- AE 2320 CX02 Thu 3:00–3:50 PM: selected style, lock icon, with title line.

## Details panel (AE 2320)
- h2 "AE 2320", full title **"Introduction to Orbital Mechanics"** (never truncated here).
- **Quiet note** under the title (252 × 47, ~10px, `--color-ink-muted`): **"Full course title shown here. Calendar labels use an ellipsis when space is limited."**
- Then the usual: Lecture professor "Ye Lu" with its hint → "Sections in this schedule" → Lecture CL01 ("Only lecture", instructor block: "Ye Lu" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md))) and Lab CX02 (**"Unlock"**) → "View other lab choices".

## Notes for building
- Each block keeps its full text in its accessible label ("AE 2320 CL01, Monday, 9:00 AM–9:50 AM, Unity Hall 400"), so truncation never hides information from screen readers. Add the full title to that label too.
- The design doesn't show whether title or room wins when space is short. Here the title replaces the room line.
