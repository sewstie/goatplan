# 36 · Returning visit · Choices restored

- PNG: `div.app-35.png` · Figma node `68:13027` (inside `section#state-36` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 01/03/04 · After Skip or Finish, the guide stays dismissed on this device. Restored settings replace no defaults." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)) with saved status ([`div.app-12.md`](div.app-12.md)). This file is the reference for the **success banner**.

## Scenario
The student comes back after finishing or skipping the guide. Their saved C Term plan opens with every choice kept: 9 AM start, Work block, lecture professor Ye Lu and lab CX02. No guide is shown.

## Sidebar
- "3 selected": AE 2320 (selected, lock icon, "CL01 · Lab CX02"), AE 2410 ("C01"), AE 2210 ("C01").

## Header
- Single pill "Schedule 1 of 1". Subtitle **"Saved C Term plan · 3 courses · 1 schedule fits"**.
- Actions: **"Schedule saved"** (9px, 400, line-height 13, `--color-ready`) · "Saved plans ⌄" · primary **"Saved"** button (79 × 36, check icon 16).

## Preferences
Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on).

## Banner — success variant
Same banner shape as the warning and info ones (1416 × 36, radius 10, padding 10 / 12, gap 9):
- bg `--color-success-surface`, icon 15 (check circle), text `--color-success-ink`.
- **"Plan restored · 9 AM start, Work, Ye Lu and lab CX02 are kept."** 10px, 400, line-height 15.5.

## Calendar
Compact blocks, 8:30 AM–4:30 PM, early band, Work Tue/Fri. AE 2320 CL01, AE 2410 C01, AE 2210 C01 Mon–Fri; CX02 Thu 3:00–3:50 PM selected with lock icon.

## Details panel (AE 2320)
Lecture professor **"Ye Lu"** (no "Optional" label) with its hint · Lecture CL01 ("Only lecture", Ye Lu, "— / 5") · Lab CX02 (**"Unlock"**) · "View other lab choices".

## Data
- The guide's dismissed flag is stored per browser, separately from plans. A returning student with a stored flag never sees the guide.
- Banner text lists what was restored: start time, blocked-time names, lecture professor, locked sections.
