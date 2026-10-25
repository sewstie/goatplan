# Spec: MVP fixes (honest sorting, phone layout, smaller fixes)

Source: `issues/product-brief.md`, items 1–6 and the "Course data updated" label from item 7. Deploy and README get their own work later.

## Problem Statement

The planner works end to end, but two things block launch, and a few smaller ones make it feel unfinished.

- **The Sort menu doesn't keep its promise.** Each order is a blend of weights, so other terms can outweigh the one the student picked. Under "Most days off" a 5-day schedule can come first while a 4-day one exists. Five of the six orders often show the same top schedule, so the menu feels fake.
- **The app can't be used on a phone.** At 375 px the three-column desktop layout is squeezed, the page scrolls sideways, day names overlap and classes become slivers. Students check their schedule on their phone between classes.
- **Smaller problems:**
  - The Sort options have no accessible names, so screen readers can't read them.
  - When a chosen professor's sections can't fit, the diagnosis doesn't offer "Allow any professor".
  - Removing a course by mistake can't be undone.
  - "7 gaps" counts the 10-minute breaks between back-to-back classes and tells the student nothing useful.
  - Nothing says how fresh the course data is.

## Solution

- **Sorting.** Each order ranks by **its own measure first**. Only ties fall back to Best overall, and then to section order. The engine does this for every schedule it checks, so the top schedule is the best on that measure among all schedules that fit, not only among the ones returned.
  - *Latest start* and *Earliest finish* look at the worst day of the week first and then at every day on average. That way the top schedule starts late, or ends early, every day.
  - *Most compact* ranks by free time between classes, ignoring 10-minute breaks.
- **Phone.** Below 640 px the planner becomes one column:
  - a collapsible "Your courses" list
  - the preferences
  - the schedule switcher and badges
  - a **day-by-day calendar** that opens on today, with every class's time and room in full
  - course details open in a **bottom sheet** when a course or class is tapped

  `/plans` and "Sections to register" also fit the phone, and nothing scrolls sideways. Tablet (834 px) and desktop (1440 px) don't change.
- **Smaller fixes:**
  - Each Sort option is announced by its label, with its description.
  - The diagnosis offers "Allow any professor for PH 1110". When that isn't enough on its own, it offers "Allow any professor for PH 1110 and change to 11:00 AM", which works in one click.
  - Removing a course shows "Removed MA 1024 · Undo" for 6 seconds. Undo brings it back with its locks, professor and picked options.
  - The gap badge says "3 h free between classes".
  - The sidebar says "Course data updated Oct 25, 2026".

## User Stories

### Sorting

1. As a student with a Friday job, I want "Most days off" to put a schedule with the fewest days on campus first, so that I can keep my work day.
2. As a student, I want "Most days off" to never show a 5-day schedule above a 4-day one, so that I can trust the order.
3. As a night owl, I want "Latest start" to put the schedule whose earliest class of the week is latest first, so that I never have an early morning.
4. As a night owl, I want "Latest start" to also prefer later starts on every other day, so that I can sleep in most days, not only on my worst day.
5. As an athlete, I want "Earliest finish" to put the schedule whose latest class of the week ends earliest first, so that I'm never late for practice.
6. As an athlete, I want "Earliest finish" to also prefer earlier ends on every other day, so that I'm free early most afternoons.
7. As a student who hates mornings, I want "Fewest early classes" to put the schedule with the fewest class minutes before 10 AM first, so that the label means what it says.
8. As a commuter, I want "Most compact" to put the schedule with the least free time between classes first, so that I spend less time waiting on campus.
9. As a commuter, I want 10-minute breaks between back-to-back classes not to count as free time, so that walking between rooms doesn't hurt a schedule's rank.
10. As a student, I want the top schedule to change when I switch sorts and a better one exists for the new sort, so that the menu feels real.
11. As a student, I want schedules that tie on my chosen sort to be ordered by Best overall, so that the more balanced one comes first.
12. As a student, I want each sort's top schedule to be the best among all schedules that fit, not only the ones on screen, so that I don't miss a better schedule.
13. As a student, I want the top schedule's first badge to show the best value in the list for my sort, so that I can see why it's first.
14. As a student, I want "Best overall" to keep working as it does today, so that my default results don't change.
15. As a returning student, I want my saved plans and draft to keep their chosen sort, so that nothing changes without my knowing.
16. As a student, I want the Sort descriptions to say plainly what each sort does, so that I pick the right one.
17. As a student with a very large course set, I want the ranking to use the schedules that were checked when the search stops early, so that I still get a sensible answer quickly.

### Sort menu accessibility

18. As a screen reader user, I want each Sort option to be announced by its label, so that I know what I'm picking.
19. As a screen reader user, I want each option's description read as extra detail, so that I understand it without the label getting long.
20. As a keyboard user, I want the Sort menu to keep all of its current keys, so that nothing I've learned breaks.
21. As a test author, I want to pick a sort by its accessible name, so that tests read like what a person does.

### Diagnosis

22. As a student who picked a professor whose sections can't fit, I want the fix "Allow any professor for PH 1110", so that I can see whether another professor works.
23. As a student who picked a professor and a late start time, I want a single fix that allows any professor and moves the start time, so that one click gives me schedules.
24. As a student, I want every fix to show how many schedules it gives, so that I can choose between fixes.
25. As a student whose saved professor doesn't teach this term, I want "Allow any professor" offered too, so that I'm not stuck.
26. As a student, I want applying the professor fix to clear the professor in the course panel, so that what I see matches what's used.

### Undo remove

27. As a student who removed the wrong course, I want an "Undo" right away, so that I can get it back in one click.
28. As a student, I want Undo to bring back the course's locks, professor and picked lab or discussion, so that I don't redo my choices.
29. As a student, I want the course to come back in the same place in "Your courses", so that my list looks the same.
30. As a student who had the course's details open, I want them open again after Undo, so that I'm back where I was.
31. As a student, I want the toast to go away by itself after about 6 seconds, so that it doesn't stay in my way.
32. As a slow reader, I want the toast to stay while my pointer is on it or focus is inside it, so that it doesn't vanish before I click.
33. As a screen reader user, I want the toast announced politely, so that I know the course was removed and that I can undo it.
34. As a keyboard user, I want to reach "Undo" with Tab and press it with Enter or Space, so that I don't need a mouse.
35. As a keyboard user, I want focus on the restored course after Undo, so that I keep my place.
36. As a student, I want Undo to go away once I change something else, so that it never puts a course back into a plan that has since changed.

### Gap badge

37. As a student, I want the gap badge to say how much free time I have between classes, so that I understand it.
38. As a student, I want "No gaps between classes" when there's none, so that compact schedules are easy to spot.
39. As a student, I want short amounts in minutes ("40 min free between classes") and longer ones in hours ("2.5 h free between classes"), so that it reads naturally.
40. As a student, I want the badge and the "Most compact" order to use the same rule, so that the top schedule never shows more free time than the one below it.

### Phone layout

41. As a student on a phone, I want no sideways scrolling anywhere, so that I can use the app with one thumb.
42. As a student between classes, I want the calendar to open on today, so that I see where my next class is right away.
43. As a student, I want to read each class's course, type, time and room in full, so that I know where to go.
44. As a student on a weekend, I want the calendar to open on my next day with classes, so that I see something useful.
45. As a student, I want to switch days with buttons for Mon to Fri, so that I can check another day.
46. As a student, I want a dot on days that have classes, so that I can see my days off without tapping each one.
47. As a student with weekend classes, I want Sat and Sun buttons only when I have class then, so that the row stays short.
48. As a student on a day without classes, I want "No classes on Friday", so that I know it's empty on purpose.
49. As a student, I want online classes with no set time listed under the day, so that I don't forget them.
50. As a student, I want to tap a class to open its course details, so that I can see sections and professors.
51. As a student, I want course details in a bottom sheet I can close with a tap outside or the Close button, so that I get back to the calendar quickly.
52. As a student, I want the sheet to open only when I tap something, so that it never covers the screen unasked.
53. As a student, I want "Your courses" collapsed once I have courses, so that the schedule shows first.
54. As a student, I want the collapsed list to show my course codes, so that I know what's in the plan without opening it.
55. As a new student, I want "Your courses" open when it's empty, so that I can search right away.
56. As a student, I want to add several courses in a row on my phone, so that I can build a plan quickly.
57. As a student, I want to remove a course by tapping a large enough button, so that I don't hit the wrong one.
58. As a student, I want to switch schedules with large previous and next buttons, so that it's easy with a thumb.
59. As a student, I want the Sort, start-time and other preferences to fit on the screen, so that I can change them on my phone.
60. As a student, I want "Block a time" to open in a sheet on my phone, so that its day and time controls fit.
61. As a student, I want Save, Saved plans and Sections to register reachable in the header, so that I can finish a plan on my phone.
62. As a student, I want my saved plans on `/plans` to fit the phone, so that I can check them during registration week.
63. As a student, I want "Sections to register" shown as one card per section on my phone, so that I can read each CRN, time and room.
64. As a student, I want copy, print and the Workday link to work on my phone, so that I can register from it.
65. As a first-time student on a phone, I want the guide to point at controls I can see, so that I can follow it.
66. As a tablet or laptop user, I want nothing to change on my screen, so that the layout I know stays the same.
67. As a keyboard user on a narrow window, I want every phone control to work with the keyboard, so that the narrow layout doesn't lock me out.
68. As a screen reader user, I want the day buttons announced as tabs with the current day selected, so that I know which day I'm reading.

### Course data date

69. As a student, I want to see when the course data was last updated, so that I know whether seat numbers are fresh.
70. As a student, I want the date for the term I'm looking at, so that it's the right one.

## Implementation Decisions

### Order of work and commits

1. **Engine** (allowed for this work; commits separate from the UI; done before any UI). The contract doc first, then engine code, engine tests, golden files and the rebuilt WebAssembly in one commit.
2. **Lead / shared**:
   - engine types
   - sort presets
   - planner store (undo, professor fix, combined fix)
   - shared listbox names
   - Toast
   - Sheet bottom side
   - phone breakpoint
   - AppShell single column
   - frontend architecture doc
   - project rules: phone is now in scope at 375 px
3. **Feature tickets**, in parallel once step 2 is merged:
   - (a) gap badge and fix label
   - (b) Undo toast wiring
   - (c) phone day calendar
   - (d) phone courses, preferences, switcher and details sheet
   - (e) `/plans` and registration cards
   - (f) "Course data updated"
4. **Integration**: the phone Playwright project, screenshots, ui-reviewer, lint, test and build.
- One ticket file per step goes in `issues/`, numbered after this spec.

### Module design: few deep modules, small interfaces

The rules from the sorting spec still hold, and this work adds to them:

- **The engine is the only module that ranks and diagnoses.** TypeScript never reorders `schedules` and never works out its own fixes. The one exception is the unavailable-professor answer, and even that uses a real engine solve for its count.
- **A sort is data, never a branch.** A preset row names its `primary` measure. No function anywhere switches on preset IDs, except the existing badge table that picks the leading badge.
- **Extend existing modules first.** Most interfaces below already exist. The new ones are a pure day-view module, the Toast and the phone shell. Each replaces logic that would otherwise be spread across several components.
- **The deletion test.** No pass-through helpers: no `getPrimary(preset)`, no `formatFreeTime` exported on its own, no `useIsPhone` hook that only wraps a media query, no undo service around the store. That work goes inside one of the modules below.
- **Layout is CSS, not state.** The phone or desktop choice is made with the `tablet:` breakpoint in markup. The store never knows the screen size. The only screen-size state is the phone shell's sheet and collapse state.

| Module | Interface | What it hides | New or existing |
|---|---|---|---|
| **Engine ranking** | JSON request/response: `sort.primary` in, extra `score` fields out | Per-day measures; the comparison chain (primary, second step, total, section order); keeping the best N with that same chain | Existing, extended |
| **Engine diagnosis** | JSON `diagnosis.fixes` | When to try the combined professor + start-time fix, and finding the latest start that works without the professor rule | Existing, extended |
| **Sort presets** | Read-only table: preset ID → label, description, primary measure. Plus the existing "is this a preset ID" check | Menu order, default preset, which measure each sort uses | Existing, the weights move out |
| **Request building** | One function: draft or plan in, engine request out | Every preset sends the Best overall weights plus its `primary`; plus everything it already does | Existing, same interface |
| **Planner store** | Its state and actions (one new state field, two new actions) | Snapshotting a removed course, clearing it on any other draft change, restoring it, the extra solve for an unavailable professor, applying a combined fix | Existing, extended |
| **Schedule badges** | One function: the shown schedule's meetings, its score, and the preset in; at most 3 texts out | Week facts from meetings (start, finish, days off); free-time wording from `score.freeMinutes`; leading badge; rounding | Existing; the interface adds the score |
| **Diagnosis text** | `fixText(fix, context)` | Labels for each fix kind, including the combined professor fix | Existing, one more label case |
| **Day view** | One pure function: the schedule's items and today's weekday in; the days to show (each with "has classes"), the default day, and each day's classes sorted by start out | Weekend days only when used; today, or the next day with classes; the "no set time" list kept apart | New, in the schedule folder |
| **Listbox** (shared UI) | Unchanged props | Names from labels, descriptions attached | Existing, accessibility fix |
| **Toast** (shared UI) | `message`, one `action` (label + handler), `onDismiss`, fixed duration | Timer with pause on hover or focus, live region, placement | New |
| **Sheet** (shared UI) | Adds `side?: "right" \| "bottom"` | Bottom placement, height limit, rounded top | Existing, one prop |
| **App shell** | Unchanged slots | Single column below 640 px, the details slot rendered into a bottom sheet on phone, opening only on tap | Existing |

Type shapes that pin the decisions down (not code to copy):

```ts
type SortPrimary = "earlyMinutes" | "firstStart" | "lastEnd" | "days" | "freeMinutes";
// SORT_PRESETS: Record<SortPresetId, { label: string; description: string; primary: SortPrimary | null }>

interface Score { total: number; earlyMinutes: number; gapMinutes: number; lateMinutes: number; days: number;
  firstStart: number; lastEnd: number; averageStart: number; averageEnd: number; freeMinutes: number }

type Fix = /* existing kinds */ | { kind: "clearAnyOf"; course: string; startsAfter?: number; schedules: number; capped: boolean };

// planner store
removedCourse: {
  code: string;
  index: number;
  locks: string[] | undefined;
  professor: string | null | undefined;
  alternatives: Record<string, string[]>; // schedule key → section ids, this course only
  wasSelected: boolean;
} | null;
undoRemoveCourse(): void;
dismissRemovedCourse(): void;

// day view
(items: readonly ScheduleItem[], today: Day) => {
  days: { day: Day; hasClasses: boolean }[];
  defaultDay: Day;
  classesByDay: Record<Day, ScheduleItem[]>;
  noSetTime: ScheduleItem[];
}
```

### Engine contract (additive to version 1)

- Version 1 stays frozen. All new fields are additive, like `anyOf` and the late-minute pair before them. Requests without `sort.primary` rank exactly as today, and the existing golden answers don't change.
- **`sort.primary`** (optional; `null` or missing means Best overall): one of `earlyMinutes`, `firstStart`, `lastEnd`, `days`, `freeMinutes`. Any other value gives `badRequest` with `sort.primary` in `detail`.
- **Comparison chain**, used both to keep the best N and for the final order:
  1. the primary measure (`firstStart` is better when higher; all others when lower);
  2. the second step, only for `firstStart` (then `averageStart`, higher is better) and `lastEnd` (then `averageEnd`, lower is better);
  3. `total`, lower is better;
  4. the existing section-order tie-break.
- **New score fields**, all minutes:
  - `firstStart`: the earliest class start over the week.
  - `lastEnd`: the latest class end over the week.
  - `averageStart`: the average of each day's first start, over days with class, rounded to the nearest minute.
  - `averageEnd`: the same for each day's last end.
  - `freeMinutes`: the sum of the breaks between two classes on the same day that are longer than 10 minutes.
  - `gapMinutes` keeps its meaning.
- Classes with no set time don't count toward any measure, as today.
- **Capped searches**: when `capped` is true, `primary` ranks only the schedules found. This is written in the contract and gets no UI message.
- **Combined professor fix**: for each course with a nonempty `anyOf` whose options were removed by it (`removed.notAnyOf > 0`, or the course is in the problem set):
  - First try `clearAnyOf` alone, as today.
  - If that gives 0 and `startsAfter` is set, find the latest `startsAfter` that gives schedules once that course's `anyOf` is cleared. If there is one, return `{kind: "clearAnyOf", course, startsAfter, schedules, capped}`.
  - Only the start time is combined, never blocked times or full sections.
  - Fix ordering doesn't change: preference changes first, dropping a course last, more schedules first.
- The engine follows its existing structure and formatting, with no comments. The WebAssembly is rebuilt and committed with the source.

### Sort presets

| ID | Label | Description | Primary |
|---|---|---|---|
| `bestOverall` | Best overall | A balance of start time, gaps and days | none |
| `fewestEarly` | Fewest early classes | Fewer classes before 10 AM | `earlyMinutes` |
| `latestStart` | Latest start | Classes start as late as possible each day | `firstStart` |
| `earliestFinish` | Earliest finish | Classes end as early as possible each day | `lastEnd` |
| `fewestDays` | Most days off | Fewer days on campus | `days` |
| `fewestGaps` | Most compact | Less free time between classes | `freeMinutes` |

- Every preset sends the Best overall weights: early cutoff 600 / 3 per minute, gap 1, per day 60, late cutoff 1440 / 0. So `score.total` always means the Best overall score.
- `earlyMinutes` keeps its 10:00 AM cutoff, so "Fewest early classes" means before 10 AM.
- Preset IDs don't change. Drafts and saved plans keep their stored ID, and nothing is migrated.
- The two new descriptions are added to `docs/design/copy.md`.
- The leading-badge table doesn't change.

### Diagnosis UI

- Label for `clearAnyOf` without `startsAfter`: "Allow any professor for PH 1110".
- Label with `startsAfter`: "Allow any professor for PH 1110 and change to 11:00 AM". The time format is the same as "Change to 10:00 AM". A value of `0` reads "…and clear start restriction".
- Applying it clears the course's professor and, when `startsAfter` is present, sets `preferences.startsAfter`. Both happen in one draft change and one solve.
- **Unavailable professor** (the professor has no sections this term, so the engine isn't called): the store runs one solve without that course's professor rule. If that gives schedules, it adds `clearAnyOf` with that solve's count. Several unavailable courses get one fix each, in course order. That extra solve isn't shown and doesn't replace the answer on screen.

### Undo remove

- `removeCourse` saves a snapshot in `removedCourse` before removing, then removes as today.
- Removing another course replaces the snapshot. There is only one level.
- Any other draft change clears it: add a course, preferences, sort, lock, professor, alternative, applying a fix, switching term, opening a plan.
- Changing the selected course or schedule index doesn't clear it, because those don't change the plan.
- `undoRemoveCourse`:
  - puts the code back at `index`, clamped to the list length;
  - restores locks, professor and this course's alternatives;
  - selects the course again if `wasSelected`;
  - clears the snapshot, then solves as any draft change does.
- `dismissRemovedCourse` clears the snapshot.
- The snapshot isn't saved to the draft in localStorage or with saved plans, so a reload loses it.

### Toast (shared UI)

- One toast at a time, rendered once by the app shell from `removedCourse`.
- Copy: "Removed MA 1024 · Undo". The middle dot is text. "Undo" is a real `<button>`.
- **Look**, tokens only:
  - surface fill, popover border and popover shadow, card radius;
  - ink text at the 11 px size, weight 570;
  - Undo in the accent color at 650, styled as the existing text button;
  - padding 10 / 14, gap 12.
  - No new color tokens.
- **Placement:**
  - 1440 and 834 px: bottom centre, 16 px from the bottom edge, above the panels and below dialogs.
  - Phone: full width minus 16 px on each side, above the bottom sheet's edge when the sheet is open.
- **Timing:**
  - 6 seconds.
  - The timer pauses while the pointer is over the toast or focus is inside it, and starts again from the time left when they leave.
  - When it runs out, the toast calls `onDismiss`.
  - A new message starts a fresh timer.
- **Motion:** a short fade and 8 px slide in, and a fade out. With reduced motion, it appears and disappears with no movement.
- **Accessibility:**
  - The container is `role="status"` with `aria-live="polite"`, and its text is the whole message.
  - Focus doesn't move to it.
  - It's reachable with Tab, as the last stop before the page's end.
  - No Ctrl/⌘+Z shortcut.
  - After Undo, focus moves to the restored course's row in "Your courses". On phone the list opens first if it's collapsed.

### Gap badge

- It reads `score.freeMinutes` from the shown schedule.
- Wording, with the value rounded to the nearest 30 minutes when it's 1 h or more:
  - 0 → "No gaps between classes"
  - 1–59 → "{n} min free between classes"
  - 60 or more → "1 h free between classes", "2.5 h free between classes", "3 h free between classes"
- Its position in the badge order doesn't change. The 30-minute gap threshold and the gap count are removed.
- When `freeMinutes` is missing, from a saved plan's older stored response, the badge works it out from the meetings with the same rule, so old plans still read correctly. This lives inside the badges module, not in a separate helper.

### Sort options' accessible names

- In the shared listbox, each option's label is its own element. The option is `aria-labelledby` the label and `aria-describedby` the description. The check icon stays hidden from screen readers.
- No visual change. The professor picker gets the same fix.
- The e2e sort helper selects by `getByRole("option", { name })`.

### Course data updated

- Source: `generatedAt` of the selected term from the term list already in the store. No new fetch.
- Copy: "Course data updated Oct 25, 2026": short month, day, year, in the student's time zone, in a `<time>` with the full timestamp in `dateTime`.
- **Look:** muted ink at the 9 px size, weight 400.
- **Placement:**
  - 1440 and 834 px: the bottom of the sidebar, right above `SupportLinks`.
  - Phone: the bottom of the page.
  - `/plans` shows it for the selected plan's term.
- Nothing is shown before the term list loads, and there's no "data is old" warning.

### Phone layout

- **Breakpoint:** a new theme breakpoint `tablet` at 40rem (640 px).
  - Below it is the phone layout.
  - From 640 px up, every screen looks exactly as today, and the 834 and 1440 px screenshots don't change.
  - Components write phone styles unprefixed and today's styles under `tablet:`. `wide` stays as it is.
- **Planner order, one column, 16 px side gutter:**
  1. header: brand, term, saved plans and Save
  2. "Your courses" disclosure
  3. Preferences
  4. schedule switcher and badges
  5. banner ("best 200 of N", "No schedule fits.")
  6. day calendar
  7. "Course data updated"
- **"Your courses" disclosure:**
  - A full-width button "Your courses (3)" with a caret that turns when open, and `aria-expanded` / `aria-controls`.
  - When collapsed, one muted line underneath: "MA 1024 · CS 2022 · PH 1110".
  - Open by default when there are no courses, closed once there is one.
  - Open/closed is session-only shell state.
  - When open, it shows the existing sidebar content unchanged: term picker, search, results, course rows.
  - Adding a course keeps it open.
- **Day calendar** (from the day-view module):
  - A row of day tabs: Mon to Fri, plus Sat and Sun only when used. Short names. A 4 px dot in the course-neutral ink under days with classes.
  - The selected tab has the accent-soft fill and accent text.
  - It opens on today, or on the next day with classes when today has none (weekends wrap to Monday).
  - The picked day is component state and isn't saved.
  - Under the tabs: the day's classes as full-width blocks, sorted by start. Each block shows course code and type, time range and room, using the existing course color slots. Nothing is truncated: long rooms wrap.
  - Blocks are stacked in time order, not drawn to scale, so short classes stay readable. A divider row marks breaks longer than 10 minutes, with "1 h free".
  - Classes that overlap with a blocked time keep their existing hatched blocked-time look as a row.
  - A day without classes shows "No classes on Friday".
  - The "No set time" strip comes after the day's classes.
  - Tapping a block selects that course and section and opens the details sheet.
- **Details bottom sheet:**
  - The shared Sheet with `side="bottom"`: full width, at most 85 % of the screen height, top corners at the panel radius, scrolls inside, Close button in the header.
  - It shows the same details content as the desktop panel: sections, professor picker, lab choices, diagnosis and fixes.
  - It opens only when something is tapped (a course row, a search result's details, a class block). It never opens because `selectedCourse` changed.
  - Closing doesn't clear the selection.
- **Preferences:**
  - Controls wrap. Sort and "Starts after" each get a full row, and the toggles share one.
  - Listboxes open full width under the control, 16 px from the screen edges.
  - "Block a time" opens its form in the bottom Sheet instead of a popover.
- **Schedule switcher:** one row "‹ Schedule 3 of 200 ›". The badges wrap underneath as whole pills, 4 px apart vertically and 8 px horizontally.
- **Header:**
  - Save, Saved plans and Sections to register stay in one row.
  - Labels that don't fit become icon buttons with the same accessible name and a tooltip on hover or focus.
  - The page title keeps its size and may wrap.
- **Guide:** when a step points into the collapsed course list, the list opens first. The popover is full width minus 16 px, under its target.
- **`/plans`:**
  - The same one column: plan list on top, the selected plan below.
  - Its calendar uses the same day view.
- **Sections to register:**
  - On phone, each section is a card with label/value rows for course, section, CRN, days and time, room and instructor.
  - Copy, Print and "Open Workday" sit above the cards as full-width buttons.
  - Print output keeps the desktop table.
- **Touch targets:** at least 44 × 44 px on phone, using an invisible hit area where the visual size is smaller. Desktop and tablet sizes don't change.
- **Text:** no text below the design's sizes. Phone may use one step larger for block times and rooms (10 px instead of 8 px) so they're readable at arm's length.

### Keyboard navigation

- **Tab order follows the visual order** at every width:
  - Phone: header → "Your courses" disclosure (and its content when open) → preferences → switcher → day tabs → day blocks → toast, if shown.
  - 834 and 1440 px: unchanged.
- **Day tabs** (`tablist`, each `tab` with `aria-selected`, the day panel is a `tabpanel` labelled by its tab):
  - ArrowLeft and ArrowRight move between tabs and select them (automatic activation). They wrap at the ends.
  - Home and End jump to the first and last tab.
  - Tab moves into the panel.
  - Only the selected tab is in the tab order (roving tabindex).
- **Day blocks:** buttons, with Enter or Space to open details. Each block's accessible name reads course, type, time and room in full ("MA 1024 lecture, 10:00 to 10:50 AM, Olin Hall 126").
- **"Your courses" disclosure:** a button with Enter or Space to toggle. Focus stays on it.
- **Schedule switcher:** unchanged. ArrowLeft and ArrowRight inside the group, and the buttons.
- **Bottom sheet:**
  - Focus moves to the sheet's heading on open and is trapped inside.
  - Escape and Close shut it, and focus goes back to what opened it.
  - Tapping the backdrop closes it.
- **Sort menu and other listboxes:** unchanged keys (see the sorting spec). The names now come from the labels.
- **Toast:** see above. It's reached with Tab, Undo works with Enter or Space, and focus never jumps to it.
- **Course row remove → Undo → focus on the restored row.** Removing with the keyboard moves focus to the neighbouring row, as today.

### Focus, hover and pressed states

- **Focus:**
  - Every interactive element uses the existing focus ring: a 2 px outline in the focus color, 2 px offset, for `focus-visible` only.
  - Field-style controls keep the choice-line border plus the field-focus halo.
  - The ring is never removed or clipped. Scroll containers on phone have enough inner padding for it to show.
  - Day tabs show the ring around the tab. Day blocks show it around the block, over the course color.
- **Hover** (pointer devices only, behind `@media (hover: hover)` so taps don't leave a stuck hover):
  - Day blocks use the existing block hover: the course's hover-line border and the block hover shadow.
  - Day tabs: surface-selected fill when not selected.
  - Disclosure button and toast Undo: the existing button hover.
  - Icon buttons in the header: the existing icon-button hover.
- **Pressed:** no separate pressed look, as Figma has none. Selecting a tab or tapping a block changes state at once.
- **Selected:**
  - Selected day tab: accent-soft fill, accent text, weight 650.
  - Selected block (after tapping): the existing selected-block look (surface-raised, accent border, selected shadow).
- **Disabled:** existing tokens (button-disabled, line-disabled, ink-faint).
- **Motion:**
  - The disclosure caret turns 180°, the sheet slides up and the toast fades.
  - All of these are short transform or opacity transitions, turned off for reduced motion.

### Responsive rules

- **1440 px (main design):**
  - Layout, sizes and the three panels exactly as in `docs/design/frames.md` (`div.app-6` and the others).
  - New things here: the "Course data updated" line at the bottom of the sidebar, the Undo toast bottom centre, the new gap wording in the existing badge pill, and the new fix label in the existing fix list.
  - None of them moves anything else.
- **834 px (tablet):**
  - The existing tablet behaviour: below the wide breakpoint the details panel sits under the calendar.
  - The toast sits bottom centre and never covers the switcher.
  - Badges wrap as whole pills.
  - Longer fix labels wrap inside the fix row; the count stays on the right, or moves under the label when there's no room.
  - "Course data updated" stays in the sidebar.
  - No sideways scroll.
- **Below 640 px (phone, checked at 375 px):** the phone layout above.
- **Every width:**
  - No sideways page scroll (`scrollWidth` ≤ `clientWidth`).
  - Nothing overlaps the switcher or the header actions.
  - DM Sans from the app layout.
  - Colors, radii, shadows and sizes only from theme tokens and CSS variables. No hex values in components and no new color tokens. A token missing in Figma is marked "proposed, not in Figma yet" in `docs/design/tokens.md`, as today.

### Modules and shared files to change

| Area | Owner | Change |
|---|---|---|
| Engine API doc | lead | `sort.primary`, five score fields, `clearAnyOf.startsAfter`, capped note |
| Engine (scoring, solver comparison, diagnosis, JSON, tests, golden) | engine, allowed for this work | Same structure, no comments, separate commits |
| Built WebAssembly | generated | Rebuilt from source |
| Engine types in the web app | lead | Mirror the contract |
| Sort presets, request building | lead | `{label, description, primary}`; Best overall weights for all |
| Planner store | lead | `removedCourse`, `undoRemoveCourse`, `dismissRemovedCourse`, unavailable-professor fix, combined fix in `applyFix` |
| UI primitives | lead | Listbox names, Toast (new), Sheet `side` |
| Global CSS | lead | `tablet` breakpoint only |
| App shell, sidebar, page | lead | Single column, details sheet on phone, toast, data date slot |
| Project rules and architecture doc | lead | Phone in scope at 375 px; screenshots at 375, 834 and 1440 |
| Diagnosis text | lead | Combined fix label |
| Schedule (badges, day view, phone calendar) | schedule | Badges read `freeMinutes`; new day-view module and phone calendar |
| Courses (disclosure content, row targets) | search | Touch targets, restored-row focus |
| Preferences and sections | prefs | Wrapping row, Block-a-time sheet on phone |
| Plans and registration | plans | `/plans` one column, registration cards |
| Design copy | lead | New descriptions, toast, free-time wording, combined fix, data date |

Not touched: data scripts and published term data.

## Testing Decisions

- A good test checks behavior through a module's interface. Good examples: a request and its response, a draft and the request it builds, a store action and the state after it, items and the day view they give, a key press and what the user sees. Tests don't reach private helpers or check how something is computed inside. Rewriting inside a module shouldn't break its tests.
- **Seams, highest first.** All exist except the day view, which replaces calendar logic that would otherwise sit in components.
  - **Engine contract** (JSON request/response):
    - For each `primary`, the #1 schedule equals the brute-force best over all valid schedules on a fixed course set, with a small `maxSchedules` (5) so the kept-best-N path is covered.
    - The second step: two schedules equal on `firstStart` are ordered by `averageStart`; the same for `lastEnd` / `averageEnd`. The averages are fair to schedules with fewer days.
    - Ties on the measure fall back to `total`, then section order.
    - Without `primary`, the golden answers don't change.
    - An unknown `primary` gives `badRequest`.
    - Score fields: back-to-back 10-minute breaks give `freeMinutes` 0, and classes with no set time are ignored.
    - Diagnosis: the 12 PM professor case returns `clearAnyOf` with `startsAfter`, and applying it gives the stated count. The 11 AM case still returns plain `clearAnyOf`.
    - Prior art: the existing engine API, score, diagnosis and golden tests.
  - **Request building:** every preset sends the Best overall weights and its `primary`. Older stored IDs are kept. Prior art: the existing request-building tests.
  - **Planner store** (actions and state):
    - Undo restores position, locks, professor, alternatives and selection.
    - A second remove replaces the snapshot.
    - Each kind of draft change clears it; selection changes don't.
    - Reload loses it.
    - Applying a combined fix sets both, in one solve.
    - The unavailable-professor answer gets a `clearAnyOf` fix with a real count.
    - Prior art: the existing store and saved-view tests, with the engine fake.
  - **Schedule badges:** free-time wording at 0, 40, 60, 75, 150 and 180 minutes; the fallback for older responses; the leading badge unchanged. Prior art: the existing schedule copy tests.
  - **Diagnosis text:** both professor fix labels, and the `startsAfter: 0` wording. Prior art: the existing diagnosis text tests.
  - **Day view:**
    - The default day on weekdays, on weekends and on days without classes.
    - Weekend tabs only when used.
    - Classes sorted by start, and no-set-time items kept apart.
    - Prior art: the existing schedule items and calendar bounds tests.
  - **Shared UI** (component tests through user actions):
    - Listbox options' names and descriptions.
    - Toast: timer, pause on hover and focus, `role=status`, Undo by keyboard.
    - Sheet: bottom side, focus trap and return, Escape.
    - Day tabs: arrows, Home and End, roving tabindex, selected state.
    - Prior art: the existing listbox, dialog and tooltip tests.
  - **Browser** (Playwright, production build):
    - A new `phone` project at 375 × 812 with touch.
    - No sideways scroll on the planner, `/plans` and Sections to register.
    - By touch: add a course, switch schedules, open and close details, remove and Undo.
    - Each class's time and room is visible in the day view.
    - Keyboard-only flow at 834 px.
    - Each sort picked by name, and #1's lead badge is at least as good as #2's.
    - The "Allow any professor" fix works end to end.
    - "Course data updated" shows the term's date.
    - Screenshots at 375, 834 and 1440 px. The 834 and 1440 px ones are compared to the design PNGs. The 375 px ones become the new reference and are added to `docs/design/screens/` with a note.
    - Prior art: the sorting, sort-menu, schedule-badges and plans specs.
- Wiring-only components (the shell layout, preferences row wrapping) get no tests of their own; the browser specs cover them.
- **Definition of done:**
  - `npm run lint`, `npm run test`, `npm run build` and the engine tests pass.
  - The WebAssembly build is reproducible.
  - The screenshots match.
  - The ui-reviewer agent finds no blocking issues.

## Out of Scope

- Vercel deploy, the domain and the README (brief item 7, apart from the data date).
- Lunch break sort, least walking, "closest to my plan", weighted sliders, .ics export, sharing links, multi-term planning.
- Any ranking, filtering or diagnosing in TypeScript beyond the unavailable-professor extra solve.
- Engine API version 2, or more than one `primary` per request.
- Combining the professor fix with blocked times or full sections.
- An undo history, undo after reload, a keyboard undo shortcut, and undo for anything other than removing a course.
- A compact week view on phone, swiping between days, drag-to-dismiss sheets.
- A Figma pass for the phone layout.
- Landscape-specific phone layouts. Landscape uses the phone or tablet layout by width.
- A "data is old" warning.
- Dark theme, new color tokens, a pressed state.

## Further Notes

- **The brief's open questions, answered:**
  - Phone calendar: day by day.
  - Latest start: the latest earliest start of the week first, then the latest average daily start.
  - The domain waits for the deploy work.
- **Why the professor fix wasn't offered** (checked on 2027-C with MA 1024, CS 2022 and PH 1110 by Burnham):
  - At 11 AM the engine already offers it.
  - At 12 PM or later, clearing the professor alone still gives 0, because the start time also blocks every other PH 1110 option.
  - The combined fix covers this case.
- **Moving every preset onto the Best overall weights** makes `score.total` mean the same thing in every sort. That's what lets ties fall back to Best overall.
- The phone layout is built without a design frame. The 375 px screenshots and this spec stand in for one until a Figma pass, and `CLAUDE.local.md` is updated to say phone is in scope.
- Saved plans store their last engine response. Plans saved before this change have no new score fields. The badges fall back to working out free time from the meetings, and the next solve fills them in.
