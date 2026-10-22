# 30 · First visit · Wait for term data

- PNG: `div.app-29.png` · Figma node `68:11171` (inside `section#state-30` of "Prototype v2.") · frame 1680 × 800
- Figma caption: "Issue 04 · The existing term control is highlighted. Next waits for a valid loaded term; Skip stays available." · Static screen, no interactions.
- Loading state from [`div.app-1.md`](div.app-1.md), with changes. This file is the reference for the **first-plan guide popover** and the **target highlight**. States 31–35 and 37 reuse them.

## Scenario
A first visit. C Term sections are still loading. The guide opens at step 1 of 5 and points to the term field. Next waits until the term has loaded.

## Layout
```
div.app
├── Sidebar
├── main.workspace
│   ├── header
│   ├── Preferences row
│   └── Weekly schedule      1416 wide: no details panel in this state
└── Guide popover            292 wide, floating at x 250, y 178
```

## Sidebar
- **Term field highlighted**: a 2px `--color-accent` outline, 4px outside the field (radius 14, the field's 10 + 4).
- **Search box, disabled**: bg `--color-surface-disabled`, border `--color-line-disabled`, search icon at 40%, placeholder "Course code or professor" in `--color-ink-faint`. 7 below it:
- Hint **"Search works once sections load."** (9px, 400, line-height 14.4, `--color-ink-muted`, 2 side padding, 20 below).
- "Your courses" · "0 selected". No skeleton cards and no empty text.

## Header
- Skeleton bar 130 × 26 next to the title (as in state 02). Subtitle **"Loading C Term sections…"**. Save disabled.

## Preferences
Start · **Any time** · Block a time · Only open sections (on).

## Calendar
- Full width (1416). Empty 8 AM–6 PM grid, no loading blocks. Caption **"Awaiting term data"** · "Monday–Friday".

## Guide popover (`Getting started, step 1 of 5`)
Floats over the calendar, 12 right of the sidebar. It never covers the control it points to.

- 292 wide, bg `--color-surface`, border 1px `--color-guide-line`, radius 15, padding 19 top / 20 sides / 16 bottom, column gap 8, shadow `--shadow-guide`.
- Use the layer name as its accessible name: "Getting started, step 1 of 5".

1. **Top row** (space-between): **"Getting started · 1 of 5"** (9px, 600, line-height 13, `--color-accent`) and a close button **"Close guide"** (× icon 13).
2. h2 **"Choose your term"**: 17px, 700, letter-spacing −0.4, line-height 22.1, `--color-ink`. 3 above.
3. Body: **"Everything you add belongs to this term. Once its sections load, you can start choosing courses."** 11px, 400, line-height 19.3, `--color-ink-muted`.
4. **Hint** (2 above): **"Wait for C Term sections to load."** 10px, 400, line-height 16, `--color-guide-hint`.
5. **Actions** (8 above), row gap 8, centered:
   - **"Back"**: small button 66 × 34, padding 8 / 9, gap 6, radius 9, caret-left icon 16, label 10px / 570 / line-height 12. **Disabled** on step 1: bg and border `--color-button-disabled`, icon at 40%, label `--color-button-disabled-ink`.
   - **"Skip guide"**: text button, 9px, 400, line-height 13, `--color-ink-muted`.
   - **"Next"**: pushed to the right, 65 × 34, caret-right icon 16. **Disabled** here (same disabled style).
6. **Retention note** (5 above): **"Your choices stay in your plan."** 8px, 400, line-height 12, `--color-ink-muted`.

### Button states across the guide
| Control | Enabled | Disabled | Focused |
|---|---|---|---|
| Back | bg `--color-surface`, border `--color-line-button`, label `--color-ink` | as above | — |
| Next / Finish guide | bg and border `--color-accent`, label and icon `--color-on-accent` | as above | 2px `--color-accent` outline, 3px outside, radius 12 |

### Target highlight
The control the step talks about gets a 2px `--color-accent` outline, 4px outside its edge, with the control's radius + 4. The control stays usable. Targets per step: term field (1), search box (2), Lecture professor select (3), Preferences row (4), schedule switcher or count pill (5).

## The five steps
| Step | Target | Heading | Popover position |
|---|---|---|---|
| 1 | Term field | "Choose your term" | right of the sidebar ([this file](div.app-29.md)) |
| 2 | Search box | "Add the courses you need" | right of the sidebar ([`div.app-30.md`](div.app-30.md)) |
| 3 | Lecture professor | "A professor preference is optional" | left of the details panel ([`div.app-31.md`](div.app-31.md)) |
| 4 | Preferences row | "Make room for your day" | under the preferences row ([`div.app-32.md`](div.app-32.md)) |
| 5 | Schedule switcher | "Browse, inspect, then save if you like" | over the calendar's lower left ([`div.app-33.md`](div.app-33.md)) |

Step 3 is skipped when no planned course has lectures ([`div.app-28.md`](div.app-28.md)). Whether the count then reads "of 4" is not shown in the design.

## Interactive states
- Back disabled (first step). Next disabled until the term has loaded. Skip guide and Close guide always work.
- Focus moves into the popover when it opens. Escape works like Close guide.

## Data
- Next enables when `/data/{termId}.json` loaded successfully. A failed load keeps it disabled and shows the existing error state.
- Skip, Close and Finish remember in this browser that the guide was dismissed ([`div.app-35.md`](div.app-35.md)).
