# GoatPlan: Feature Brief (MVP Fixes)

Source: hands-on test of `localhost:3000` on Oct 25, 2026. Term C 2027 with MA 1024, CS 2022 and PH 1110 (plus CS 2303 and PH 1120 in an earlier run).

## Problem

The core flow works: search → add courses → schedules → pick professor → rules and diagnosis → save → sections to register. Two things still block an MVP launch:

1. **The sort menu doesn't do what its labels promise.** A student who picks "Most days off" can be shown a 5-day schedule first, even though a 4-day one exists.
2. **The app is unusable on a phone,** and students often check their schedule there.

## Already working (don't break)

- **Courses:** term picker, course search, adding courses, the 5-step guide, and the "best 200 of N" banner.
- **Professor picker:** it filters schedules (PH 1110 went from 1,281 to 91 with Nancy Burnham), and online lectures show in "No set time".
- **No clashes:** no lecture, lab or discussion overlap within a course (checked across all 91 results).
- **Rules and diagnosis:** "Starts after" and "Block a time" remove schedules, and the diagnosis explains 0 results with one-click fixes.
- **Saved plans:** save, reload and restore keep the sort, preferences and professor, with a "Plan restored" note.
- **Sections to register:** copy, print and the Workday link.
- No console errors.

## User cases

1. **Most days off:** "I work on Fridays. I pick *Most days off* and expect the first schedule to have the fewest days on campus."
2. **Latest start:** "I'm not a morning person. *Latest start* should put my latest-starting week first."
3. **Sorts should differ:** "When I switch sorts, the top schedule should change if a better one exists for that sort. Otherwise the menu feels fake."
4. **Ties:** "When two schedules are equal on what I sorted by, show the more balanced one first."
5. **Phone:** "Between classes, I open GoatPlan on my phone to check where my next class is. The calendar has to be readable without scrolling sideways."
6. **Phone editing:** "On my phone I can add a course, switch schedules and open a course's details."
7. **Professor diagnosis:** "My chosen professor's sections all clash. The diagnosis should offer *Allow any professor for PH 1110*, not only a time change."
8. **Undo remove:** "I removed the wrong course by accident and want it back in one click."
9. **Readable gap badges:** "The '7 gaps' badge confuses me. I want to know how much free time is between my classes."

## Issues

### 1. Sorting picks the wrong top schedules (blocker)
- **Seen:** 5 of the 6 sorts return the same #1. *Most days off* puts a 5-day schedule first while its own list contains a 4-day one. *Latest start*'s #1 isn't the best for its own metric.
- **Cause:** each preset in `sortPresets.ts` is a blend of weights, so other terms can outweigh the chosen one. For example, a day off is worth 300 points, but 5 extra hours of gaps cost more. Ties are broken by section order, not by Best overall.
- **Fix:** the engine compares schedules **by the chosen metric first**, then by the Best overall score, then by section order. The kept-best-N list and the final order must both use this comparison. This is an additive API change (e.g. `sort.primary`), and Best overall sends no primary.
- **Done when:**
  - Under *Most days off*, a 4-day schedule always beats a 5-day one.
  - Each sort's #1 is the best on its own metric among all valid schedules, not just the returned ones.
  - Ties fall back to Best overall.
  - Tests cover each preset.

### 2. Phone layout is broken (MVP)
- **Seen:** at 375 px the desktop three-column layout is squeezed, the page scrolls sideways, day names overlap and classes are slivers. At about 450 px the day headers already overlap.
- **Fix:** a single column on narrow screens:
  - courses list (collapsible)
  - schedule switcher and badges
  - calendar as a day-by-day view, or a compact week view with short day names (Mon, Tue…)
  - course details in a bottom sheet
- **Done when:**
  - Nothing scrolls sideways at 375 px.
  - Every class's time and room can be read.
  - Adding a course, switching schedules and opening details all work by touch.
  - There's an e2e test at the mobile viewport.

### 3. Sort options have no accessible names
- **Seen:** the Sort menu's options have empty accessible names, so screen readers and test selectors can't find them.
- **Done when:** each option's name is its label, with its description attached, and e2e tests select sorts by name.

### 4. Diagnosis misses "Allow any professor"
- **Seen:** with Nancy Burnham chosen for PH 1110 and a late start time, the diagnosis names the professor but offers only "Change to 10:00 AM".
- **Done when:** if a professor choice removes options, the fix "Allow any professor for <course>" is offered and works.

### 5. Removing a course has no undo
- **Done when:** after a course is removed, a toast says "Removed MA 1024 · Undo" for about 6 seconds, and Undo restores the course with its locks, professor and lab choices.

### 6. Gap badge is unclear
- **Seen:** "7 gaps" counts the 10-minute breaks between back-to-back classes.
- **Done when:** the badge shows free time in a form people understand, e.g. "3 h free between classes", ignoring breaks of 10 minutes or less.

### 7. Launch basics (MVP)
- Deploy to Vercel, keep the daily data update running, and show "Course data updated <date>".
- README: what it does, a screenshot or GIF, the architecture (C++ → WASM in a worker, Next.js, data pipeline), and how to run it.

## Priority

| # | Item | MVP? | Size |
|---|---|---|---|
| 1 | Sorting picks the wrong top | Must | M (engine + web) |
| 2 | Phone layout | Must | L |
| 7 | Deploy + README | Must | M |
| 3 | Sort accessible names | Should | S |
| 4 | "Allow any professor" fix | Should | S |
| 6 | Gap badge wording | Should | S |
| 5 | Undo remove | Could | S |

## Out of scope (after launch)
Lunch break sort, least walking, closest-to-my-plan backups, weighted sliders, .ics export, sharing links, multi-term planning.

## Open questions
- Phone calendar: a day-by-day view or a compact week view?
- Should *Latest start* use the latest *earliest* start across the week, or the average start per day?
- Which domain will the deployed site use?