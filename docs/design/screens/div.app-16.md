# 17 · Seat count changed since saving

- PNG: `div.app-16.png` · Figma node `30:15958` (inside `section#state-17`) · frame 1680 × 800
- Figma caption: "Hypothetical saved CX02 fill-up; show the stale choice and available replacements." · Static screen, no interactions.
- "No schedule fits" layout ([`div.app-7.md`](div.app-7.md)) with the locked-full block and problem card from [`div.app-9.md`](div.app-9.md). One Figma call was made for the alternative row (node `30:16382`).

## Scenario
The student opened a saved plan. Since saving, lab **CX02** (locked) filled up, so with "Only open sections" on nothing fits. Other labs are available.

## Sidebar
"3 selected": AE 2320 (**selected**, lock icon, "CL01 · Lab CX02"), AE 2410, AE 2210.

## Header
- Warning pill **"0 schedules fit"**. Subtitle **"Saved plan · Availability changed"**. Save schedule disabled.
- Preferences: Starts after 9:00 AM · Blocked Work · Tue, Fri 2 PM–4 PM · Block a time · Only open sections (on).

## Banner (warning)
**"CX02 filled up since you saved."** (700) + **" Pick another lab."** (400).

## Calendar
- AE 2320 CL01 (dark), AE 2410 C01, AE 2210 C01, Work Tue/Fri, early band.
- **AE 2320 CX02**, Thu 3:00–3:50 PM, drawn in the **locked-full** style (clash colors + accent ring + lock icon, no room line), like CX01 in state 10.

## Details panel
1. Kicker **"Saved plan needs attention"** (same kicker style as "Needs attention").
2. h2 "AE 2320", title "Introduction to Orbital Mechanics".
3. Issue box: h3 **"CX02 filled up since you saved."** · body **"Pick another lab to restore an open schedule."**
4. **Problem section card** (cream, see state 10): "Lab CX02" + small accent **"Unlock"** button · "Thu · 3:00 PM–3:50 PM" · "Higgins Labs 230" · **"0 of 40 seats open · Full"** · "Ye Lu".
   - In Figma this card overlaps the bottom ~13px of the issue box. Treat that as a Figma glitch and keep the normal gap.
5. Label **"Other lab choices"** (10px, 650).
6. **Alternative rows** (`div.alternative`), 238 wide, ~48–51 high, gap ~4 between rows:
   - Border 1px `--color-line`, radius 8, padding 11 top / 8 bottom / 7 sides, row gap 7, centered.
   - **Radio marker**: empty circle icon 13 × 13 (unselected).
   - Text column (gap 2): section code **"CX01"** / **"CX03"** (10px, 700, line-height 14.5, `--color-ink`) and meeting **"Thu · 2:00 PM–2:50 PM"** / **"Thu · 4:00 PM–4:50 PM"** (8px, 400, line-height 11.6, `--color-ink-muted`).
   - Right-aligned status **"1 open"** / **"31 open"** (8px, 400, line-height 11.6, `--color-ink-muted`).
7. **Primary full-width button "Pick CX03"** with a check icon 16 (regular size, 238 × 36).

## Interactive states
- Alternative rows act as a radio group. None is checked in the design; the button suggests CX03 (the one with the most open seats). Picking a row should update the button label ("Pick CX01").
- "Unlock" removes the lock instead.

## Data
- Saved plans store section IDs. On load, compare the saved sections' seats with the current term data. A saved section that is now full triggers this state.
- Alternatives: other sections of the same type (lab) for the course, with open seats = `capacity − enrolled`. Sort by most open seats for the suggestion.
