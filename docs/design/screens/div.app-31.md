# 32 · Tutorial · Optional lecture professor

- PNG: `div.app-31.png` · Figma node `68:11614` (inside `section#state-32` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 04/06 · A course is selected; Any professor is retained and Next is available." · Static screen, no interactions.
- Guide popover from [`div.app-29.md`](div.app-29.md), planner with AE 2320 as in [`div.app-3.md`](div.app-3.md). Only the differences are listed.

## Scenario
Guide step 3 of 5. AE 2320 is in the plan and selected. The guide points to the real Lecture professor select, which still says Any professor. Nothing has to change to continue.

## Sidebar
- "1 selected": AE 2320 (selected row, no lock), "CL01 · Lab CX02".

## Header and preferences
- Switcher ‹ "Schedule 1 of 3" ›, subtitle "1 course · 3 schedules fit", Save enabled.
- Start · Any time · Block a time · Only open sections (on).

## Calendar
- 8:30 AM–4:30 PM, regular block sizes. AE 2320 CL01 Mon–Fri 9:00–9:50 AM (dark), CX02 Thu 3:00–3:50 PM (selected).
- No early band (Any time).

## Details panel
- Lecture professor (no "Optional" label in this frame), select **"Any professor"** with the **target highlight** (2px `--color-accent` outline, 4 outside, radius 12). Hint: "Filters lectures only. Labs and discussions can have other instructors."
- Then "Sections in this schedule": Lecture CL01 ("Only lecture", Ye Lu, "— / 5", "Rating unavailable") and Lab CX02 ("Lock"), "View other lab choices".

## Guide popover — step 3
Placed **left of the details panel** (x 1078, y 172; its right edge is 12 from the panel).
- "Getting started · 3 of 5"
- h2 **"A professor preference is optional"** (two lines)
- Body **"Use Lecture professor to narrow this course’s lectures. Any professor keeps every eligible lecture time; compatible labs can have another instructor."**
- No hint line.
- Back enabled · Skip guide · Next **enabled and focused**.

## Data
- The step targets the selected course if it has lectures, otherwise the first planned course that has them. With none, the step is skipped ([`div.app-28.md`](div.app-28.md)).
- The guide never picks a professor.
