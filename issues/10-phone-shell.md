# 10: Phone shell: one column, course list disclosure, details sheet

Ticket: 10
Wave: 2
Status: DONE
Blocked By: 04

**Track:** SHARED (lead: app shell, sidebar, page; search for the course list's touch targets)

**What to build:** On a phone (below 640 px) the planner is one column and never scrolls sideways. "Your courses" collapses once there are courses, so the schedule comes first. Tapping a course opens its details in a bottom sheet. Tablet and desktop look exactly as before.

- [ ] Below the `tablet` breakpoint, in a single column with a 16 px side gutter:
  1. header
  2. "Your courses" disclosure
  3. Preferences
  4. switcher and badges
  5. banner
  6. calendar
  7. footer

  From 640 px up nothing changes, and the 834 and 1440 px screenshots still match.
- [ ] **"Your courses (3)" disclosure:**
  - a full-width button with a turning caret and expanded/controls state, plus a muted line with the course codes when it's collapsed;
  - open when there are no courses, closed once there is one, and it stays open while adding;
  - session-only shell state;
  - when open, it shows the existing term picker, search, results and course rows.
- [ ] **Details:** on phone, the details content shows in the bottom Sheet.
  - It opens only when the student taps a course row or a search result's details, never because the selected course changed by itself.
  - Closing it keeps the selection.
  - The sheet state lives in the shell, not the store.
- [ ] Guide: a step that points into the collapsed list opens it first. Its popover is full width minus 16 px, under the target.
- [ ] Keyboard and focus:
  - The tab order matches the visual order.
  - The disclosure toggles with Enter or Space.
  - Sheet focus is trapped and returns on close.
  - The focus ring is never clipped.
  - Hover styles only apply on pointer devices.
- [ ] Until 12 lands, the calendar on phone may show the current week view. The no-sideways-scroll rule still holds: the calendar card scrolls inside itself if it has to.
- [ ] A new Playwright `phone` project at 375 × 812 with touch, and a spec that checks:
  - no sideways scroll on the planner;
  - add a course by touch;
  - opening and closing details in the sheet;
  - the list collapsing after the first course.
