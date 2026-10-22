# 10 · No schedule fits · Full section locked

- PNG: `div.app-9.png` · Figma node `68:3127` (inside `section#state-10` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Hypothetical CX01 fill-up; unlocking removes the constraint." · Static screen, no interactions.
- Same layout as [`div.app-7.md`](div.app-7.md) (state 08). Only the differences are listed.

## Scenario
Three courses. The student locked AE 2320's lab **CX01**, which is now full. "Only open sections" is on, so nothing fits. (The fill-up is hypothetical.)

## Sidebar
- "3 selected": AE 2320 (**selected**, lock icon, sub **"CL01 · Lab CX01"**), AE 2410, AE 2210.

## Header
- Pill "0 schedules fit" (warning style). Subtitle **"Your locked lab has no open seats."** Save schedule disabled.

## Preferences
Starts after **9:00 AM** · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on).

## Banner
**"CX01 is full."** (700) + **" The lock leaves no options while Only open sections is on."** (400).

## Calendar
- Range 8:30 AM–4:30 PM, early band "No classes before 9:00 AM", Work Tue/Fri 2–4 PM.
- Normal blocks: AE 2320 CL01 Mon–Fri 9:00–9:50 (dark, with room "Unity Hall 400"), AE 2410 C01 10:00–10:50, AE 2210 C01 11:00–11:50.
- **Locked full block** — AE 2320 **CX01**, Thursday **2:00 PM–2:50 PM**, full column width:
  - Clash colors: bg `--color-clash-surface`, border 1px `--color-clash-line`, text `--color-clash-ink`.
  - Plus the **selected ring**: `box-shadow: 0 0 0 0.5px var(--color-accent)`.
  - Lock icon 10 before the code. Shows code, section and time; no room line.

## Details panel — "Needs attention"
1. Kicker "Needs attention", h2 **"AE 2320"**, title "Introduction to Orbital Mechanics".
2. Issue box:
   - h3 **"This lock leaves no options"**
   - Body **"Locking CX01 leaves no options because it’s full. Unlock it to consider CX02 or CX03."**
3. **Section card, problem variant**: same layout as the section choice card, but bg `--color-problem-surface` and border 1px `--color-problem-line`.
   - Heading "Lab CX01" + **"Locked" badge**: bg `--color-accent-soft`, text `--color-accent`, 9px, 570, line-height 12.6, padding 3 / 6, radius 5.
   - Meta: "Thu · 2:00 PM–2:50 PM" · "Higgins Labs 230" · **"0 of 40 seats open · Full"** · "Ye Lu".
4. "Ways to fix it" → one primary full-width button **"Unlock CX01"** with an (open) lock icon 16.

## Interactive states
- Locked section: lock icons on the course row and block, "Locked" badge in the card.
- "Unlock CX01" removes the lock.

## Data
- Engine: `total: 0`, `emptyCourses` = AE 2320 (options without CX01 count under `removed.notLocked`, the ones with it under `notOpen`). "Unlock CX01" = fix `unlock` for AE 2320. The engine would probably also offer `allowFull`, but the design shows only Unlock.
- "consider CX02 or CX03": the other lab sections of the course (TypeScript, from the term file).
- Seats line adds **" · Full"** when `status` is full (0 open).
