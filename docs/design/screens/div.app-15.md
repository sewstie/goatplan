# 16 · Waitlist-only section

- PNG: `div.app-15.png` · Figma node `68:5859` (inside `section#state-16` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Illustrative AE 2410 availability: no open seats, 7 of 15 waitlist places used." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). This file introduces the **info banner**, the **toggle off** state and the **waitlist badges**.

## Scenario
Three courses. "Only open sections" is **off**, so the schedule includes AE 2410 C01, which has no open seats but has a waitlist (7 of 15 used). AE 2320's lab CX02 is locked. AE 2410 is selected.

## Sidebar
"3 selected": AE 2320 (lock icon), **AE 2410 (selected)**, AE 2210. No warning on the row.

## Header
- Single pill "Schedule 1 of 1". Subtitle **"3 courses · 1 schedule fits · includes a waitlist section"**. Save enabled.

## Preferences — toggle off
- **Only open sections, off**: track 29 × 17, bg `--color-toggle-off`, radius 20, padding 2. Knob 13 × 13 (`--color-surface`, radius 6.5) on the **left**, with an × icon 9 instead of the check. Label unchanged.
- Other items: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time. No Sort.

## Banner — info variant
Same banner shape as the warning one (radius 10, padding 10 / 12, gap 9, 1416 wide) but:
- bg `--color-accent-soft`, text `--color-info-ink`, **info-circle** icon 15.
- **"AE 2410 C01 is waitlist only."** (700) + **" It fits your times, but registration is not guaranteed."** (400). 10px, line-height 15.5.

## Calendar
Same as the regular planner: AE 2320 CL01 (dark), AE 2410 C01 (normal peach), AE 2210 C01 (yellow), AE 2320 CX02 Thu 3:00–3:50 PM (selected, lock), Work Tue/Fri, early band. The waitlisted section looks like any other block.

## Details panel (AE 2410)
1. h2 **"AE 2410"**, title **"Introduction to Aerospace Structures"**, label "Your choices".
2. Section choice card:
   - Heading **"Lecture C01"** + **"Waitlist only" badge**: bg `--color-warning-soft`, text `--color-warning`, 9px / 570 / line-height 12.6, padding 3 / 6, radius 5.
   - Meta: "Mon–Fri · 10:00 AM–10:50 AM" · "Higgins Labs 116" · **"0 of 50 seats open"** · instructor block: "Mark Richman" with "— / 5", "Rating unavailable" and "Rate My Professors" (see [`div.app-3.md`](div.app-3.md)).
   - **Waitlist line** (4 above, gap 7): people icon 12 + badge **"7 of 15 on waitlist"** (same warning badge style).
3. **Quiet note** (10px, 400, line-height 17.5, `--color-ink-muted`, padding 11 top / 13 bottom): **"This schedule includes a full section because Only open sections is off."**
4. **Primary button "Join waitlist in Workday"**, full width, regular size (padding 9 / 11, 11px label), external-link icon 16.
5. **Lecture professor** filter at the bottom of the panel (label, select **"Mark Richman"**, hint "Filters lectures only. Labs and discussions can have other instructors."). In this state it comes after the button, and the cards keep the label "Your choices".

## Interactive states
- Toggle: **off** (×, grey track, knob left). Compare the on state in [`div.app.md`](div.app.md).
- "Join waitlist in Workday" opens Workday in a new tab.

## Data
- Waitlist-only: `status` waitlist, `enrolled == capacity`, `waitlist.taken < waitlist.capacity`. Badge text "{taken} of {capacity} on waitlist".
- Engine request has `onlyOpen: false`, so the engine keeps full and waitlisted sections.
- Banner and subtitle appear when the shown schedule contains any waitlist-only section.
