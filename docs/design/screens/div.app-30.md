# 31 · Tutorial · Add at least one course

- PNG: `div.app-30.png` · Figma node `68:11400` (inside `section#state-31` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 04 · Real search and Add control; no duplicate entry form. Next is disabled until a course is added." · Static screen, no interactions.
- Guide popover from [`div.app-29.md`](div.app-29.md), search results from [`div.app-3.md`](div.app-3.md). Only the differences are listed.

## Scenario
Guide step 2 of 5. The term has loaded. The student typed "AE 2320" in the real search box and sees one result, but hasn't added it yet.

## Sidebar
- **Search box highlighted** (2px `--color-accent` outline, 4 outside, radius 13), value **"AE 2320"** in `--color-ink`.
- "Search results" · **"1 course"**:
  - AE 2320 result card: "Add" button · "Introduction to Orbital Mechanics" · **"1 lecture · 3 labs · Ye Lu"** · badge "Fits". The meta line now counts labs too.
- "Your courses" · "0 selected", empty text "Your courses will appear here." / "Search above to get started."

## Header
- Title only, no switcher. Subtitle **"Add a course to start seeing schedules."** Save disabled.

## Preferences
Start · Any time · Block a time · Only open sections (on).

## Calendar
Full width (1416), no details panel. Empty 8 AM–6 PM grid, caption "No timed courses yet". No "Add your first course" card while the guide is open.

## Guide popover — step 2
Same place as step 1 (x 250, y 178).
- "Getting started · 2 of 5"
- h2 **"Add the courses you need"**
- Body **"Use the course search by code or professor. Adding a course finds its fitting lecture and lab combinations automatically."**
- Hint **"Add at least one course to continue."**
- Back **enabled** · Skip guide · Next **disabled**.
- "Your choices stay in your plan."

## Data
- Next enables once the plan has at least one course. It doesn't wait for schedules.
