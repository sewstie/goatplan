# 29 · Course without lectures · Section selection

- PNG: `div.app-28.png` · Figma node `68:10973` (inside `section#state-29` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 02/06 · Omit the lecture professor filter and its tutorial tip. Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- Regular planner with DEMO data ([`div.app-23.md`](div.app-23.md)). Only the differences are listed.

## Scenario
One synthetic lab-only course, **DEMO 2001 "Robotics Laboratory"**. One schedule fits. Its lab B01 is locked.

## Sidebar
- "1 selected". DEMO 2001 row, title "Robotics Laboratory", sub **"B01"**. No lock icon on the row in this frame.

## Header and preferences
- Single pill **"Schedule 1 of 1"**, subtitle **"1 course · 1 schedule fits"**, Save enabled.
- Preferences: Start · Any time · Block a time · Only open sections (on).

## Calendar
- Range **1:30 PM–3:30 PM**, caption **"Auto-fit · 1:30 PM–3:30 PM"**. 2 hours over 538 (≈269 px/hour).
- One block: DEMO 2001 B01, Thursday 2:00 PM–2:50 PM, Example Lab 202, selected style with lock icon, regular text sizes.

## Details panel
1. h2 **"DEMO 2001"**, title **"Robotics Laboratory"**.
2. Quiet note (12 above): **"This course has no lecture. Choose a lab section directly."** (10px, 400, line-height 17.5, `--color-ink-muted`).
3. "Sections in this schedule".
4. Compact card: "Lab B01" + **"Unlock"** · "Thu · 2:00 PM–2:50 PM" · "Example Lab 202 · Sam Patel" · "8 of 24 seats open".
5. Disclosure "View other lab choices".
- **No Lecture professor filter**, and the first-plan guide skips its professor tip for this course.

## Data
- A course whose sections include no lecture has no professor filter.
