# Phone · 375 px · Preferences and controls

How the preferences bar, header actions and guide adapt to the phone layout.

- Width: 375 px · Breakpoint: below 40 rem (640 px)

## Preferences bar

Controls stack vertically instead of wrapping in a single row:

```
PreferencesBar (flex-col on phone)
├── row 1   "Starts after" listbox — full width
├── row 2   "Sort" listbox — full width
└── row 3   "Only open sections" toggle + "Block a time" button
```

- Listboxes open full-width, 16 px from the viewport edges.
- "Block a time" opens in a bottom `Sheet` (not the centered `Dialog`).
- Blocked-time pills appear inline with the button.

## Header actions

- **Save schedule** / **Saved** — rendered as `IconButton` (bookmark icon)
  with 44 × 44 px touch target and a `Tooltip` showing the full label.
- **Saved plans** — chevron-down trigger, same touch-target sizing.
- **Sections to register** — stays reachable in the menu.

When the title is long, header items wrap rather than overflow.

## Schedule switcher

- `ScheduleBrowser` renders the count pill and arrows in one row.
- Score badges wrap below with `flex-wrap gap-x-8 gap-y-4`, never truncated.
- Prev/next arrows: `min-w-44 min-h-44` for reliable touch targets.

## First-plan guide

- Popover is `max-w-[calc(100vw-16px)]`, positioned below its target.
- When a step points at a control inside the collapsed "Your courses"
  disclosure, the disclosure opens first (watched via `MutationObserver`
  on `.guide-popover`).
- The guide hides in Saved mode.

## "Your courses" disclosure

- Full-width button: "Your courses (3)" with a caret.
- Collapsed: muted line showing course codes ("MA 1024 · CS 2022 · PH 1110").
- Open by default when no courses; collapses once the first course is added
  (unless manually opened). Stays open while the guide is active.
- Contains the existing sidebar content: term picker, search, course list,
  footer links.
