# 12: Phone day calendar

Ticket: 12
Wave: 3
Status: OPEN
Blocked By: 10

**Track:** schedule

**What to build:** Between classes, a student opens GoatPlan on their phone and sees today's classes, each with course, type, time and room in full. They can switch days with Mon–Fri buttons, see which days have classes, and tap a class to open its details.

- [ ] A pure day-view module turns the schedule's items and today's weekday into three things:
  - the days to show, each with "has classes" (Mon–Fri, plus Sat and Sun only when used);
  - the day to open on: today, or the next day with classes, with weekends wrapping to Monday;
  - each day's classes sorted by start, with the no-set-time items kept apart.

  No other helper is exported.
- [ ] Below 640 px the calendar card shows the day view. From 640 px up it's the existing week calendar, unchanged.
- [ ] **Day tabs:**
  - short day names, and a 4 px dot under days with classes;
  - the selected tab has the accent-soft fill, accent text and weight 650; others get the surface-selected fill on pointer hover;
  - tab list semantics with the selected state;
  - ArrowLeft and ArrowRight select and wrap, Home and End jump, only the selected tab is in the Tab order;
  - the panel is labelled by its tab.
- [ ] **Day panel:**
  - full-width blocks in time order (not to scale), each showing course code and type, time range and room, at 10 px for time and room;
  - the existing course color slots, and long rooms wrap instead of being cut off;
  - a divider row "1 h free" for breaks longer than 10 minutes;
  - blocked times keep their hatched look;
  - "No classes on Friday" when a day is empty;
  - the "No set time" strip after the classes.
- [ ] Each block is a button whose name reads course, type, time and room in full. Enter, Space or a tap selects that course and section and opens the details sheet. The selected block uses the existing selected-block look, and hover uses the existing block hover on pointer devices only.
- [ ] `docs/design/copy.md` lists "No classes on {day}" and "{n} free".
- [ ] Tests:
  - the day-view module for the default day on weekdays, weekends and empty days, weekend tabs, sorting and no-set-time items;
  - a component test for the tab keys;
  - a phone browser spec: every class's time and room is visible and readable, switching days by tap, a tap opening details, no sideways scroll.
