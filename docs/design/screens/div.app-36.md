# 37 · Guide storage unavailable · Keep planning

- PNG: `div.app-36.png` · Figma node `68:13513` (inside `section#state-37` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 04 · Storage failure does not block the planner; persistent dismissal is not promised." · Static screen, no interactions.
- Planner as in state 32 ([`div.app-31.md`](div.app-31.md)), info banner from [`div.app-15.md`](div.app-15.md), guide from [`div.app-29.md`](div.app-29.md). Only the differences are listed.

## Scenario
The browser blocks storage, so GoatPlan can't remember the guide's progress. The planner and the guide still work for this visit.

## Banner — info variant
Under the preferences row, full width: bg `--color-accent-soft`, info icon 15, text `--color-info-ink`, 10px, line-height 15.5:
**"Guide progress can’t be remembered in this browser. You may see the guide again next visit."**

## Planner
- AE 2320 selected (no lock), "Schedule 1 of 3", "1 course · 3 schedules fit", Save enabled.
- Start · Any time · Block a time · Only open sections (on).
- Calendar shorter (582) because of the banner: compact blocks, 8:30 AM–4:30 PM, CL01 Mon–Fri, CX02 Thu selected.
- Details panel: Lecture professor "Any professor" with the target highlight, Lecture CL01, Lab CX02 ("Lock"), "View other lab choices".

## Guide popover — step 3, storage variant
At x 1078, y 172 (left of the panel), 292 wide.
- "Getting started · 3 of 5"
- h2 **"Keep planning in this visit"**
- Body **"You can continue or skip the guide. Your course and choices stay in the open plan."**
- No hint. Back · Skip guide · Next (focused).

## Data
- Show the banner when writing the dismissed flag fails. Planning continues normally.
- The design pairs this copy with step 3. Whether every step switches to it, or only the step shown when storage failed, is not specified.
