# 18 · Evening / Weekend · Calendar expands

- PNG: `div.app-17.png` · Figma node `30:16413` (inside `section#state-18`) · frame 1680 × 800
- Figma caption: "Illustrative early, evening, and Saturday meetings expand the real base timetable." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). One Figma call was made for the Tuesday column (node `30:16624`).

## Scenario
The real three-course timetable plus three example meetings: a Tuesday 8 AM seminar, a Friday evening seminar and a Saturday seminar. The calendar grows to 7 days and 7:30 AM–8:30 PM. No course is selected, so the details panel shows the info variant.

## Sidebar
"3 selected": AE 2320 (lock icon), AE 2410, AE 2210. AE 2320's row is shown filled (selected) in the design even though the panel shows the info variant.

## Header and preferences
- Single pill "Schedule 1 of 1". Subtitle **"3 courses + example meetings · 1 schedule fits"**. Save enabled.
- Start-time pill: **"8:00 AM"**. Blocked Work · Tue, Fri 2 PM–4 PM. No Sort.

## Calendar — 7-day layout
- **Day headers use short names**: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun". Seven equal columns (~154 wide at this size).
- Range **7:30 AM–8:30 PM**: labels "7:30 AM", "8 AM" … "8 PM", "8:30 PM". Grid 536 high for 13 hours → **~41 px per hour**.
- Caption: **"Auto-fit · 7:30 AM–8:30 PM"** · right side **"7 days"** (instead of "Monday–Friday").
- Early band from 7:30 to 8:00: **"No classes before 8:00 AM"**.
- **Dense block layout** (used at this hour height): padding 3 / 4, gap 2, inset 3 from both column sides. Title row gap 2: code 8px / 700 / line-height 10.4, section 6.5px / 400 / line-height 8.45. Time 6.8px / 400 / line-height 8.84. **No room line.**
- Work blocks: hatch as usual; "Work" 9px / 600, then "2:00 PM–4:00 PM" / "blocked" 7px / line-height 10.5; padding 9.5 top / 4 sides.

| Item | Day | Time | Fill |
|---|---|---|---|
| AE 2320 CL01 | Mon–Fri | 9:00–9:50 AM | `--color-course-1` |
| AE 2410 C01 | Mon–Fri | 10:00–10:50 AM | `--color-course-2` |
| AE 2210 C01 | Mon–Fri | 11:00–11:50 AM | `--color-course-3` |
| AE 2320 CX02 | Thu | 3:00–3:50 PM | selected style + lock icon |
| **Morning seminar** E01 | Tue | 8:00–8:50 AM | `--color-course-4` |
| **Evening seminar** E02 | Fri | 6:00–8:00 PM | `--color-course-4` |
| **Weekend seminar** E03 | Sat | 10:00–11:50 AM | `--color-course-4` |

  Example meeting layer labels end with "Room to be assigned" (no room line is drawn).
- Sunday is empty but still shown.

## Details panel — info variant
Same as state 01's info panel:
- Info icon, h2 **"Every meeting stays visible"** (wraps to two lines).
- Paragraph **"The calendar fits the actual items, including work blocks, early classes, evenings, and weekends."**
- Rows:
  - 01 — **"First item · Tuesday at 8:00 AM"**
  - 02 — **"Last item · Friday ends at 8:00 PM"**
  - 03 — **"Weekend · Saturday 10:00–11:50 AM"**

## Rules this state documents
- **Auto-fit range**: start at the half hour before the earliest item (block, class or start-time band), end at the half hour after the latest one. 8:00 AM earliest → 7:30 AM; 8:00 PM latest → 8:30 PM.
- **Days**: Mon–Fri by default; show all 7 days (short names) when anything falls on a weekend.
- Block content shrinks as the hour height shrinks: regular (≈67 px/h), compact (≈57 px/h), dense (≈41 px/h). See [`div.app-6.md`](div.app-6.md).

## Data
- Days come from `meetings[].days` (`"Sat"`, `"Sun"` included).
- The panel text is computed from the shown items: the earliest start, the latest end and any weekend meeting.
