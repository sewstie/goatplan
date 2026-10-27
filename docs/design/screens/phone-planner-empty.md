# Phone · 375 px · Planner empty

The phone planner at first visit, before any course is added. Single column,
16 px side gutter. No Figma frame; this note and the implementation are the
reference.

- Width: 375 px · Breakpoint: below 40 rem (640 px)
- Layout: `AppShell` renders a single column; sidebar and side details panel
  are not mounted.

## Layout

```
375 × 812       bg canvas, px 16, py 14, single column, gap 12
├── header        brand row + title + subtitle + actions (wraps)
├── disclosure    "Your courses (0)" — open by default when empty
│   ├── TermPicker
│   ├── CourseSearchPanel (search box + empty list)
│   └── footer links
├── PreferencesBar   stacked: Starts-after row, Sort row, toggles row
├── banner           (empty)
├── schedule         DayCalendar, h 630, overflow hidden
│   ├── day tabs     Mon–Fri, flex-1 each (~69 px)
│   └── day panel    "No classes on Monday"
└── DataUpdated      "Course data updated Oct 25, 2026"
```

Content width: 375 − 32 = 343 px.

## What changes from desktop

- **Sidebar → disclosure.** The term picker, search box and "Your courses" list
  move into a collapsible `<YourCoursesDisclosure>` that sits between the header
  and the preferences. It opens by default when empty and collapses once the
  first course is added.
- **Details panel → bottom sheet.** The right-side `DetailsPanel` is `hidden`;
  tapping a class in the day view opens a `Sheet side="bottom"` with the same
  `CourseDetailsPanel`.
- **Week grid → day tabs.** `ScheduleView` renders `DayCalendar` instead of
  `PlanCalendar`. Day tabs (Mon–Fri, plus Sat/Sun when used) with a dot under
  days that have classes. The panel is a vertical scrolling list.
- **Preferences stack.** "Starts after" and "Sort" each take a full-width row;
  the two toggles share the third row.
- **Header actions.** Save and Saved plans become icon-only buttons (44 × 44 px
  touch target) with tooltips.
- **Schedule switcher.** Badges wrap as whole pills; prev/next arrows are 44 px.
- **Toast** sits at `bottom-16 inset-x-16`, full width on phone.
- **DataUpdated** moves to `phoneFooter`, below the schedule.

## Touch targets

Every interactive element is at least 44 × 44 px on phone. Desktop and tablet
sizes are unchanged.

## No horizontal scroll

- `main` has `min-w-0 flex-1`; the schedule section has `overflow-hidden`.
- Text uses `truncate`, `min-w-0` and `break-words` throughout.
- No element exceeds 343 px content width.
