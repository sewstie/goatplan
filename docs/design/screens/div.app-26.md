# 27 · Professor and locked lecture · Conflict

- PNG: `div.app-26.png` · Figma node `68:10453` (inside `section#state-27` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 03 · Neither restriction is relaxed, and no stale schedule is displayed. Synthetic course, instructors, section times and numeric ratings; these are layout examples, not WPI offerings." · Static screen, no interactions.
- "No schedule fits" parts from [`div.app-7.md`](div.app-7.md), DEMO data from [`div.app-23.md`](div.app-23.md). This file is the reference for the **empty "no matching timetable" calendar** and the **preserved-choices panel**.

## Scenario
The student locked lecture L04 (taught by Morgan Lee) and then chose Alex Rivera as lecture professor. No lecture satisfies both, so nothing fits. GoatPlan relaxes neither choice and shows no old schedule.

## Sidebar
- DEMO 1001 row with lock icon, sub **"L04 locked · B01 · D01"**.

## Header
- Warning pill **"0 schedules fit"** (no switcher).
- Subtitle **"Your professor choice and section locks are preserved."**
- Save schedule **disabled**.

## Preferences
Starts after **9:00 AM** · Blocked **Work** · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on).

## No banner
Unlike states 08–10, there is no warning banner.

## Calendar — no matching timetable
- Empty grid, **8 AM–6 PM**, Monday–Friday. No blocks, no early band, no blocked-time hatch.
- Caption left: **"No matching schedule"** (9px, 400, line-height 13, `--color-ink-muted`; a size up from the usual 8px caption).
- **Message card** (`div.calendar-message`), same card as the empty state in [`div.app.md`](div.app.md): 420 wide, bg `--color-surface-overlay`, border 1px `--color-line`, radius 16, padding 28 / 20, gap 6, centered over the grid.
  - Icon tile 42 × 42, `--color-accent-soft`, radius 12.
  - h3 **"No matching timetable"** (17px, 700, letter-spacing −0.3, line-height 23.8).
  - **"Your choices are kept. Choose a fix in the course panel."** (11px, 400, line-height 19.8, `--color-ink-muted`).

## Details panel
1. Kicker **"Your choices are kept"** (9px, 650, `--color-attention`).
2. h2 "DEMO 1001" (3 above), title "Engineering Seminar".
3. Lecture professor ("Optional"), select **"Alex Rivera"**, hint. 11 below.
4. **Issue box**, no icon: h3 **"Locked L04 conflicts with Alex Rivera."** · body **"L04 is taught by Morgan Lee. Choose which restriction to change."**
5. Lecture L04 + **"Unlock"** · "Tue, Thu · 11:00 AM–11:50 AM" · "Example Hall 101" · "18 of 40 seats open" · instructor block "Morgan Lee" · "4.0 / 5" · "12 ratings · Example data" · "Rate My Professors".
6. **Preserved note** (`p.preserved-note`): icon 12 + **"Lab B01 stays locked. Your time preferences are unchanged."** (10px, 400, line-height 16.5, `--color-ink-muted`).
7. **Fix list** (9 above, gap 8):
   - Primary **"Clear professor"** (icon 16).
   - Secondary **"Unlock L04"** (icon 16).

## Interactive states
- Save disabled. Both fixes enabled. Each changes only its own restriction.

## Data
- Engine: `total: 0`. The conflict is found in TypeScript: the locked lecture's instructors don't include the chosen professor.
- "Clear professor" sets the professor back to Any professor. "Unlock L04" removes that lock. Other locks and time preferences stay.
