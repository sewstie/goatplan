# 33 · Tutorial · Keep current availability

- PNG: `div.app-32.png` · Figma node `68:11981` (inside `section#state-33` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 05 · Reflect the student’s actual 9 AM restriction and Mon/Wed/Fri lunch block. Nothing resets when advancing." · Static screen, no interactions.
- Same planner as state 32 ([`div.app-31.md`](div.app-31.md)). Only the differences are listed.

## Scenario
Guide step 4 of 5. The student has already set Starts after 9:00 AM and a "Lunch" block on Mon, Wed, Fri 12–1 PM. The guide describes these settings and doesn't reset them.

## Preferences row — highlighted
- The whole row gets the target highlight: 2px `--color-accent` outline, 4 outside, square corners.
- **Starts after "9:00 AM"** · **Blocked "Lunch" "· Mon, Wed, Fri 12 PM–1 PM"** (222 wide) · Block a time · Only open sections (on).

## Calendar
- 8:30 AM–4:30 PM, early band **"No classes before 9:00 AM"**.
- **Lunch** hatch blocks Mon, Wed, Fri 12:00–1:00 PM: "Lunch" (9px, 600) / "12:00 PM–1:00 PM" / "blocked" (8px), `--color-ink-hatch`.
- AE 2320 CL01 Mon–Fri 9:00–9:50 AM, CX02 Thu 3:00–3:50 PM (selected).

## Details panel
As in state 32, without the highlight on the professor select.

## Guide popover — step 4
Placed **under the preferences row** (x 270, y 220).
- "Getting started · 4 of 5"
- h2 **"Make room for your day"**
- Body **"Your 9 AM start and lunch break are already applied. You can change these controls or keep them and continue. Only open sections is on."**
- Hint **"Time preferences are optional. Next keeps your current choices."** (two lines)
- Back · Skip guide · Next (enabled, focused).

## Data
- The body is built from the real settings: start time ("9 AM", or "Any time"), blocked-time names, and the Only open sections state. With defaults it should say so instead of naming settings that don't exist; the design doesn't show that wording.
- Next, Back, Skip and Close never change preferences.
