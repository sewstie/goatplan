# 09 · No schedule fits · Start-time preference

- PNG: `div.app-8.png` · Figma node `30:12404` (inside `section#state-09`) · frame 1680 × 800
- Figma caption: "The only AE 2320 lecture starts at 9 AM; changing the preference restores a fit." · Static screen, no interactions.
- Same layout and components as [`div.app-7.md`](div.app-7.md) (state 08). No Figma call was made for this frame: it only changes text, data and the early band.

## Scenario
Three courses. "Starts after" is set to **10:00 AM**, but AE 2320's only lecture starts at 9:00 AM, so nothing fits. AE 2320 is selected; its lab CX02 is locked.

## Differences from state 08

### Sidebar
- "3 selected": AE 2320 (**selected**, lock icon), AE 2410, AE 2210. No AB 1533.

### Header
- Pill "0 schedules fit" (warning style).
- Subtitle: **"Your start-time preference excludes AE 2320."**
- Save schedule disabled.

### Preferences
- Start-time pill value: **"10:00 AM"**.

### Banner
**"Starts after 10:00 AM"** (700) + **" excludes AE 2320’s only lecture at 9:00 AM."** (400). Same banner style.

### Calendar
- Range still 8:30 AM–4:30 PM.
- **Early band** now covers 8:30–10:00 AM, text **"No classes before 10:00 AM"**.
- **No AE 2320 CL01 blocks** (the excluded lecture is not drawn).
- AE 2410 C01 Mon–Fri 10:00–10:50, AE 2210 C01 Mon–Fri 11:00–11:50, AE 2320 CX02 Thu 3:00–3:50 PM (selected style, lock icon), Work Tue/Fri 2–4 PM.

### Details panel — "Needs attention"
1. Kicker "Needs attention".
2. h2 **"AE 2320"**, title **"Introduction to Orbital Mechanics"**.
3. Issue box:
   - h3 **"Your start time is too late"**
   - Body **"AE 2320’s only lecture starts at 9:00, so nothing works with “Starts after 10:00 AM”."** (curly double quotes around the preference; the period sits outside the quotes).
4. **Section choice card** for the blocking section (same card as state 04): "Lecture CL01" · "Only lecture" badge · "Mon–Fri · 9:00 AM–9:50 AM" · "Unity Hall 400" · "36 of 120 seats open" · "Ye Lu".
5. "Ways to fix it":
   - Primary **"Change to 9:00 AM"** with a clock icon 16.
   - Secondary **"Remove AE 2320"** with a × icon 16.

## Interactive states
- "Change to 9:00 AM" sets the start-time preference to 9:00 AM. "Remove AE 2320" removes the course.

## Data
- Engine: `total: 0`, `diagnosis.emptyCourses` = AE 2320 with `removed.startsTooEarly > 0` and `latestStartsAfter: 540`.
- "Change to 9:00 AM" = fix `relaxStartsAfter` with `startsAfter: 540`. "Remove AE 2320" = fix `dropCourse`.
- "only lecture … at 9:00 AM" uses the lecture's start time. The section card shows that lecture.
