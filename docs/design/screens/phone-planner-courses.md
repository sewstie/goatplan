# Phone · 375 px · Planner with courses

The phone planner after adding courses and getting schedules. The "Your courses"
disclosure is collapsed, the day view shows classes, and the schedule switcher
is active. Corresponds roughly to desktop states 04–06.

- Width: 375 px · Breakpoint: below 40 rem (640 px)

## Layout

```
375 × 812       single column, px 16
├── header
│   ├── breadcrumbs  "Spring 2027 › C Term"
│   ├── title row    "Schedule planner" + ScheduleBrowser
│   │                ‹ Schedule 1 of 200 ›  (badges wrap below)
│   ├── subtitle     "3 courses · 200 schedules"
│   └── actions      icon-only Save (bookmark) + Saved plans (chevron)
├── disclosure    "Your courses (3)" — collapsed, shows "MA 1024 · CS 2022 · PH 1110"
├── PreferencesBar   Starts after 9:00 AM | Sort Best overall | toggles
├── banner           "Best 200 of 1,281" (when capped)
├── DayCalendar
│   ├── day tabs     Mon–Fri, dot under days with classes
│   └── day panel    list of class blocks sorted by start time
│       ├── DayClassBlock  "CS 2022  CL01" / "10:00 AM – 10:50 AM · Higgins Labs 230"
│       ├── free divider   "1 h free"
│       ├── DayClassBlock  "PH 1110  CL01" / "12:00 PM – 12:50 PM · Olin Hall 107"
│       └── NoTimeStrip    (when online/unscheduled sections exist)
└── DataUpdated
```

## Day calendar

- **Tabs:** `role="tablist"` with arrow-key navigation (Left, Right, Home, End).
  Selected tab has `bg-accent-soft text-accent font-650`. Unselected tabs
  show `text-ink-muted`. A 4 px dot sits under days that have classes.
- **Class blocks:** full width, `rounded-block`, colored by `COURSE_COLORS[slot]`.
  Two lines: course code + section code (truncated, `min-w-0`), then time
  range + room (`break-words`). Tapping selects the course+section and opens
  the phone details sheet.
- **Free-time dividers:** between consecutive items when the gap is > 10 min.
  Shows "{N}h free" or "{N} min free" centered between hairline rules.
- **Blocked time:** hatched background, shows the label (e.g. "Work") or the
  time range, plus "blocked".
- **Empty day:** "No classes on {Day}" centered in `text-ink-muted`.
- **No set time:** online/unscheduled sections listed below the day's classes.

## Details bottom sheet

Tapping any class block opens a `Sheet side="bottom"`:
- Full width, ≤ 85 dvh, `rounded-t-panel`, slide-up transition.
- Safe-area padding for the home indicator: `pb-[max(20px,env(safe-area-inset-bottom))]`.
- Contains the same `CourseDetailsPanel` as the desktop side panel.
- Open state is local to `PlannerShell`, not the store. Closing (Escape, tap
  outside, Close button) keeps the selection.

## Schedule switcher

- Count pill "Schedule 1 of 200" and prev/next arrows in one row.
- Score badges (e.g. "Fewest early", "Latest start") wrap below as pills
  with `flex-wrap gap-x-8 gap-y-4`.
- Arrow buttons are 44 × 44 px touch targets.

## Undo toast

Removing a course shows a fixed toast at the bottom: "Removed CS 2022 · Undo".
Full width on phone (`w-full`), auto-dismisses after 6 s, pauses on hover/focus.
Undo restores the course at its original position with locks, professor and
alternatives, then opens the disclosure if collapsed and focuses the restored row.
