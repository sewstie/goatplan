# 23 · Sections to register

- PNG: `div.app-22.png` · Figma node `30:18720` (inside `section#state-23`) · frame 1680 × 800
- Figma caption: "Final section list for Workday. The copy control is a static visual, like every control in this file." · Static screen, no interactions.
- Same shell and sidebar as the planner ([`div.app.md`](div.app.md), [`div.app-6.md`](div.app-6.md)). The calendar card is replaced by a **registration sheet**. One Figma call was made for the content area (node `30:18852`).

## Scenario
A saved plan with three courses / four sections (AE 2320 lab CX02 locked). The student opens the list of sections to type into Workday.

## Sidebar
"3 selected": AE 2320 (selected, lock icon, "CL01 · Lab CX02"), AE 2410 ("C01"), AE 2210 ("C01").

## Header
- h1 **"Sections to register"** (same h1 style) + single pill **"Schedule 1 of 1"**.
- Subtitle **"3 courses · 4 sections · Saved plan"**.
- Right side, one row: **"Schedule saved"** (9px, 400, `--color-saved`) · "Saved plans ⌄" · primary **"Saved"** button with check icon (112 × 36, regular size).
- Preferences row unchanged: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on).

## Registration sheet (`section.registration-sheet`)
Replaces the calendar card: 1134 wide, bg `--color-surface`, radius 18, padding 23 / 20, column gap 10.

1. **Heading row** (space-between, centered):
   - h2 **"Ready for Workday"**: 19px, 700, letter-spacing −0.5, line-height 27.55, `--color-ink`.
   - **"4 sections across 3 courses"**: 10px, 400, line-height 14.5, `--color-ink-muted`, 5 below the h2.
   - Primary button **"Copy section list"** with a copy icon 16: padding 9 / 11, label 10px / 570 / line-height 12 (127 × 36).
2. **Table** (15 above), full width (1094). Columns: Course 306 · Section 175 · Meeting time 306 · Room / instructor 306.
   - Header cells: **"Course"**, **"Section"**, **"Meeting time"**, **"Room / instructor"**. 9px, 600, line-height 13, `--color-ink-muted`. Padding 9.5 / 5, border-bottom 1px `--color-line`.
   - Body rows: 67.4 high, border-bottom 1px `--color-line`, cell padding 14.5 / 5, top-aligned.
     - Course cell: code (11px, 700, line-height 17.6, `--color-ink`) + title (9px, 400, line-height 14.85, `--color-ink-muted`), gap 3.6.
     - Section cell: code (11px, 700) + "Lecture · 36 open" (9px, muted).
     - Meeting time: one line, 10px, 400, line-height 16, `--color-ink` (padding-top 15.5).
     - Room / instructor: room (10px, 400, line-height 16, `--color-ink`) + instructor (9px, muted), gap 3.

| Course | Title | Section | Type · open | Meeting time | Room | Instructor |
|---|---|---|---|---|---|---|
| AE 2320 | Introduction to Orbital Mechanics | CL01 | Lecture · 36 open | Mon–Fri · 9:00–9:50 AM | Unity Hall 400 | Ye Lu |
| AE 2320 | Introduction to Orbital Mechanics | CX02 | Lab · 4 open | Thu · 3:00–3:50 PM | Higgins Labs 230 | Ye Lu |
| AE 2410 | Introduction to Aerospace Structures | C01 | Lecture · 18 open | Mon–Fri · 10:00–10:50 AM | Higgins Labs 116 | Mark Richman |
| AE 2210 | Introduction to Thermal Engineering | C01 | Lecture · 4 open | Mon–Fri · 11:00–11:50 AM | Salisbury Labs 104 | David Olinger |

3. Label **"Section list"** (10px, 650, `--color-ink`), 6 above.
4. **Copy preview** (`pre.copy-preview`): full width, bg `--color-code-surface`, border 1px `--color-line`, radius 9, padding 14 / 16. Text 11px, 400, line-height 22, `--color-ink` (DM Sans, not monospace). Lines, with an em dash:
   ```
   AE 2320 — CL01 (lecture), CX02 (lab)
   AE 2410 — C01 (lecture)
   AE 2210 — C01 (lecture)
   ```
5. **Note** (10 above): **"Saving a plan in GoatPlan keeps your choices. Complete registration in Workday."** 10px, 400, line-height 17, `--color-ink-muted`.

## Details panel — "Plan ready"
Padding 20 / 16, column gap 4.
1. Kicker **"Plan ready"**: 9px, 650, line-height 13, `--color-ready`.
2. h2 **"Your registration list"** (21px, 700, −0.55, line-height 25.2), 4 above.
3. **"C Term · Spring 2027"** (11px, 510, line-height 17.6).
4. **Checks** (20 above, gap 14.8): check-circle icon 15 + text (10px, 400, line-height 14.5, `--color-ink`), gap 8:
   - **"Lecture and lab choices included"**
   - **"No overlapping meeting times"**
   - **"Preferences respected"**
5. Quiet note (10px, line-height 17.5, muted, padding 11 / 13): **"Copy these section codes into Workday. Check availability there before registering."**
6. Primary full-width button **"Open Workday"** with external-link icon 16 (regular size, 11px label).

## Interactive states
- "Copy section list" copies the preview text to the clipboard. After copying, show a short confirmation (not in the design; e.g. the label changes to "Copied" with a check, like "Saved").
- "Open Workday" opens Workday in a new tab.
- Use a real `<table>` with `<th scope="col">` headers.

## Data (TypeScript only, no engine)
- Rows: one per chosen section of the saved plan, grouped by course in plan order, lecture before lab.
- "{Type} · {open} open": section `type` capitalized, `capacity − enrolled`.
- Meeting time: "Mon–Fri · 9:00–9:50 AM" (AM/PM once when both ends share it).
- Copy text: `{code} — {section} ({type}), {section} ({type})` per course, one course per line, types lowercase.
- The checks summarize what the planner already guarantees for this plan.
