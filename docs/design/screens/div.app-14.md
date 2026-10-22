# 15 · Instructor not assigned

- PNG: `div.app-14.png` · Figma node `68:5426` (inside `section#state-15` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "AE 5231 C02 is a listed C Term example with no instructor; the professor link is omitted." · Static screen, no interactions.
- Regular planner ([`div.app-6.md`](div.app-6.md)). One Figma call was made for the lavender block (v1 node `30:15321`).

## Scenario
Four courses: AE 2320 (lab CX02 locked), AE 2410, AE 2210, and **AE 5231 "Air Breathing Propulsion"**, whose section C02 has no instructor yet. AE 5231 is selected. **No blocked time** in this state.

## Sidebar
- "4 selected". AE 5231 row (selected, 78.9 high): swatch `--color-course-4-swatch`, "AE 5231", "Air Breathing Propulsion", sub **"C02 · Instructor pending"**.

## Header and preferences
- Single pill "Schedule 1 of 1". Subtitle **"4 courses · 1 schedule fits"**. Save enabled.
- Preferences: Starts after 9:00 AM · Block a time · Only open sections. **No blocked-time pill**, no Sort.

## Calendar
- Range grows to **8:30 AM–6:30 PM** (labels "8:30 AM", "9 AM" … "6 PM", "6:30 PM"). Caption **"Auto-fit · 8:30 AM–6:30 PM"**.
- Blocks: AE 2320 CL01 (dark), AE 2410 C01 (peach), AE 2210 C01 (yellow), AE 2320 CX02 Thu 3:00–3:50 PM (selected, lock icon), and:
  - **AE 5231 C02**, Tue and Fri **4:00 PM–5:50 PM**, room line **"Online · synchronous"**. Fill `--color-course-4`, transparent border, text `--color-ink`, compact sizes (padding 3 / 5, gap 2).
- No Work blocks.

## Details panel (AE 5231)
- h2 **"AE 5231"**, title **"Air Breathing Propulsion"**, label "Your choices".
- Section choice card: heading **"Lecture C02"** + neutral badge **"Selected section"** (same style as "Only lecture"). Meta:
  - clock — **"Tue, Fri · 4:00 PM–5:50 PM"**
  - map pin — **"Online · synchronous"**
  - people — **"29 of 35 seats open"**
  - graduation cap — **"Instructor not assigned yet"**
- **Quiet note** (252 × 64, ~10px, 400, `--color-ink-muted`), two paragraphs: **"Instructor not assigned yet."** / **"Professor reviews appear when an instructor is available."**
- **No** Professor select and **no** "Rate My Professors" link.

## Data
- `instructors` is empty → sidebar sub says "Instructor pending", the meta row says "Instructor not assigned yet", and the professor section is hidden.
- "Online · synchronous" from `delivery` (no location). Online synchronous sections still have meeting times and go on the grid.
- "Selected section" badge: the course has more than one lecture section, but no other choice is shown here.
