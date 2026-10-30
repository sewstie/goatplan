# Frontend architecture

GoatPlan's web app is one planner page plus a "Sections to register" page, built
with Next.js (App Router), TypeScript and Tailwind in `apps/web`. The lead owns
the shared parts: layout, store, data, engine and UI primitives. Four feature
agents build the features in their own folders, in parallel. This page says who
owns what, what the shared store offers, and how to ask for a change to a
shared file.

Read it together with [data-format.md](data-format.md) and
[engine-api.md](engine-api.md).

## Folder map

All paths are under `apps/web/src/`.

```
app/
  layout.tsx            lead     root layout, DM Sans
  page.tsx              lead     the planner page: places every feature component
  globals.css           lead     design tokens (colors, type, spacing)
  plans/                plans    /plans, "Sections to register"
  dev/                  lead     /dev/ui and /dev/engine; 404 in production
components/
  tutorial/             lead     first-visit guide and its browser-local persistence
  ui/                   lead     primitives: Button, ButtonLink, IconButton, Badge, Chip, Toggle,
                                 Select, Listbox, TextInput, Card, Dialog, Sheet (right or bottom),
                                 Toast, Tooltip; course colors
  shell/                lead     AppShell, Sidebar, WorkspaceHeader, Placeholder, PlannerBootstrap
  courses/              search   term picker, course search, "Your courses", breadcrumbs
  schedule/             schedule calendar, schedule switcher, summary line, banner
  preferences/          prefs    the Preferences row
  sections/             prefs    details panel, lock controls, the "Choose a lab" sheet
  plans/                plans    Save / Saved plans, registration sheet and summary
lib/
  data/                 lead     term files and formatting helpers
  engine/               lead     EngineClient, the engine worker, engine types
  store/                lead     the planner store (Zustand)
  plans/                plans    saved plans and their own storage
apps/web/e2e/           browser tests (Playwright); each agent adds its own spec file
```

## Who owns what

Each feature already has placeholder components in the page, in the right
place and holding the right space. A feature agent replaces the inside of its
own components and adds new files in its own folders. **Never edit the page or
the layout to place things**: if a component needs to be somewhere new, ask
the lead (see [Asking for a shared-file change](#asking-for-a-shared-file-change)).

| Agent | Owns | Components already in the page |
|---|---|---|
| **search** | `components/courses/` | `TermPicker` (sidebar, under the logo), `CourseSearchPanel` (sidebar: search box, results, "Your courses"), `TermBreadcrumbs` (above the title) |
| **schedule** | `components/schedule/` | `ScheduleView` (calendar card), `ScheduleSwitcher` (next to the title), `ScheduleSummary` (line under the title), `ScheduleBanner` (full-width banner above the calendar) |
| **prefs** | `components/preferences/`, `components/sections/` | `PreferencesBar` (the Preferences row), `CourseDetailsPanel` (details panel: section choices, Lock/Unlock, professor, "Needs attention" and fixes), `ChooseAlternativeSheet` |
| **plans** | `app/plans/`, `components/plans/`, `lib/plans/` | `PlanActions` (header, right side), `RegistrationSheet` and `RegistrationSummary` (on `/plans`) |

- Keep the file names and exports of the placeholders; the page imports them.
- Components that need state or events become client components (`"use client"`).
- Saved plans have **their own storage** in `lib/plans/` (keys start with
  `goatplan:plans:`), not the planner store. The store only keeps the working
  draft.
- `/plans` (`app/plans/page.tsx`) belongs to the plans agent and reuses the
  shared shell and the other agents' sidebar components.
- Sort options: the store keeps six sort presets (`SORT_PRESETS`), and the
  prefs agent shows all six in the sort menu. Each preset is
  `{ label, description, primary }`, where `primary` is the score field the
  engine ranks by first (`null` for Best overall).
- Tests: unit tests go next to the code, in your folders. Browser tests go in a
  new `e2e/<agent>.spec.ts`; they run against the production build.

## Shared files: only the lead edits them

- `app/layout.tsx` and `app/page.tsx`
- `app/globals.css`
- `lib/store/`, `lib/engine/`, `lib/data/`
- `components/ui/`
- Also lead-owned: `components/shell/`, `app/dev/`, the lead's specs in `e2e/`
  (`shell`, `primitives`, `engine`), `playwright.config.ts`,
  `vitest.config.mts`, `package.json` (so new dependencies too) and everything
  in `docs/`.

### Asking for a shared-file change

Don't edit a shared file, even for a one-line fix. In your PR description, add
a section called **"Needs from lead"** that lists each change:

- the file,
- exactly what to change (a new prop, a store action, a token, a dependency),
- why your feature needs it.

Until the lead adds it, build against what exists (or a local stand-in inside
your folder) and say so in the PR. The lead makes the change in its own commit,
so every agent gets it at the same time.

## The planner store

`lib/store` is a Zustand store with everything the features share. Read it
with `usePlanner(selector)` and call its actions the same way:

```tsx
const courses = usePlanner((state) => state.courses);
const addCourse = usePlanner((state) => state.addCourse);
```

Select single values. A selector that builds a new object or array on every
call (like `selectChosenSections`) needs `useShallow` from
`zustand/react/shallow`, or it re-renders forever. `PlannerBootstrap` (in the
page) starts the store in the browser by calling `init()`.

Component tests can pass a real `createPlannerStore` instance through
`PlannerProvider`. `usePlanner` and `usePlannerStore` read that instance, so
tests can supply data, engine, and storage boundaries without replacing store
modules. Without a provider, both hooks use the app's shared store.

### State

| Field | What it is |
|---|---|
| `terms` | Published terms that haven't ended (New York time), for the term picker. |
| `termId` | The chosen term's id, like `"2027-C"`. |
| `term` | The chosen term's parsed file (courses and sections); `null` while it loads. |
| `termStatus` | `idle`, `loading`, `ready` or `error`. Plan actions do nothing until `ready`. |
| `termError` | Why the term couldn't load, in plain English. |
| `courses` | The chosen course codes, in the order they were added. |
| `preferences` | `{ startsAfter, blocked, onlyOpen }`. New drafts start at Any time (`startsAfter: 0`), with no blocked times and only open sections. Stored drafts and saved plans keep their settings, including a chosen 9:00 AM start. A blocked time can have a `label`, the name the student gave it ("Work"); it is saved with the draft but never sent to the engine. |
| `locks` | Course code → the section ids locked for that course. |
| `professorByCourse` | Course code → the selected lecture professor, or `null` for Any professor. All matching lectures remain eligible, including co-taught lectures. Labs and discussions can have other instructors. |
| `sortPreset` | The Sort choice: `bestOverall`, `fewestEarly`, `latestStart`, `earliestFinish`, `fewestDays` or `fewestGaps` (labels, descriptions and primary measures in `SORT_PRESETS`). The menu shows all six sort orders. Every preset sends the Best overall weights, so `score.total` means the same in each, plus its `primary`; Best overall sends none. Stored IDs are kept as they are. |
| `alternatives` | Per schedule (by `scheduleKey`) and per course, the same-time alternative the student picked. |
| `response` | The engine's last answer, success or engine error; `null` when there are no courses. |
| `scheduleIndex` | Which schedule in `response.schedules` is shown. |
| `solveStatus` | `idle`, `waiting` (the 200 ms pause after a change), `solving`, `done` or `error`. |
| `solveError` | Why the engine gave no answer at all (for example, the worker crashed). Engine errors are in `response`. |
| `selectedCourse` | The course the details panel shows and "Your courses" marks. The first course once a term loads; not saved in the draft. |
| `selectedSection` | The section whose calendar blocks are selected, after a click on a block; `null` otherwise. |
| `removedCourse` | The last removed course, so it can be undone: `{ code, index, locks, professor, alternatives, wasSelected }` (its position, its locks or `undefined`, its professor entry, its picked alternatives per schedule key, and whether it was selected); `null` otherwise. A second remove replaces it. Any other draft change clears it (adding a course, preferences, sort, lock or unlock, professor, alternative, applying a fix, switching term, opening a plan); selecting a course or section and paging schedules don't. Not saved with the draft or with plans, so a reload loses it. |
| `blockedChange` | The last blocked times added or removed by dragging on the calendar: `{ previous, days, start, end, erased }`, where `previous` is the blocked list from before the drag. Like `removedCourse`, any other draft change clears it, a removed course replaces it, and it isn't saved. |
| `savedPlans` | A read-only mirror of the plans source. Saved plans keep their own storage. |
| `savedPlanId` | The saved plan being viewed, or `null` for Found. `PlannerViewSync` follows `/?view=saved&plan={id}` and browser history. Never persisted with the draft. |
| `savedSelectedCourse`, `savedSelectedSection` | Selection within Saved. Found keeps its own selection. |

### Actions

| Action | What it does |
|---|---|
| `init()` | Loads the term list and opens the term used last time, or else the first upcoming one. |
| `setSavedPlans(plans)` | Refreshes the mirror from the plans source. Returns to Found if the viewed plan was removed. |
| `showFound()` / `showSaved(id?)` | Changes the viewed source without changing the draft. Saved defaults to the first saved plan of this term. |
| `nextSavedPlan()` / `previousSavedPlan()` | Pages through this term's saved plans, stopping at the ends. |
| `setTerm(termId)` | Switches term: downloads the file once (page and engine), restores that term's draft and solves. |
| `openPlan(termId, plan, chosen?)` | Opens a saved plan in one step: switches term if needed, replaces the draft (courses, preferences, locks, sort), solves once and shows the schedule with the `chosen` sections. Resolves to `false` if the term couldn't load. |
| `addCourse(code)` | Adds a course from the current term (ignored if unknown or already added) and selects it. |
| `removeCourse(code)` | Removes a course with its locks, professor and picked alternatives, keeping them in `removedCourse` first. If it was selected, the next course (or the one before) is selected. |
| `undoRemoveCourse()` | Puts `removedCourse` back at its position (clamped to the list length) with its locks, professor and alternatives, reselects it if it was selected, clears `removedCourse` and solves once. Does nothing without one. |
| `dismissRemovedCourse()` | Clears `removedCourse` without changing the plan. |
| `changeBlocked(blocked, change)` | Replaces the blocked times after a calendar drag, keeps the old list in `blockedChange` and solves once. |
| `undoBlockedChange()` | Puts `blockedChange.previous` back, clears `blockedChange` and solves once. Does nothing without one. |
| `dismissBlockedChange()` | Clears `blockedChange` without changing the plan. |
| `selectCourse(code, sectionId?)` | Selects a planned course, and optionally one of its sections; `null` clears the selection. |
| `setPreferences(changes)` | Changes any of `startsAfter`, `blocked` and `onlyOpen`. |
| `setProfessor(course, name)` | Selects a lecture professor, or `null` for Any professor, and regenerates schedules. |
| `lockSection(course, sectionId)` | Keeps only schedules that use that section (the course must be in the plan). |
| `unlockSection(course, sectionId)` | Removes that lock. |
| `setSortPreset(preset)` | Changes the Sort order. |
| `chooseAlternative(course, sectionIds)` | Picks a same-time alternative in the current schedule. It doesn't solve again. |
| `pickOption(course, sectionIds)` | Takes another option of a course and keeps the rest of the shown schedule: shows a schedule from the answer that has both, or else locks the option's new sections (in place of locks it drops) and solves again. |
| `setScheduleIndex(index)` | Shows the schedule at that position, kept within the answer. |
| `nextSchedule()` / `previousSchedule()` | Pages through the schedules, stopping at the ends. |
| `applyFix(fix)` | Applies a fix from `response.diagnosis.fixes`: start later, clear blocked times, allow full sections, unlock, allow any professor or drop a course. "Allow any professor" (`clearAnyOf`) clears the course's professor and, when the fix has `startsAfter`, sets the start time too, in one draft change and one solve. |

Selectors and helpers that come with it: `selectSchedules`,
`selectCurrentSchedule`, `selectChosenSections` (course → the section ids taken
in the current schedule, with picked alternatives), `findSchedule` (the first
schedule that can show given sections), `scheduleKey`, `storedDraft(termId)`
(the draft this browser keeps for a term), `buildRequest`, `SORT_PRESETS`,
`DEFAULT_PREFERENCES`, `MAX_SCHEDULES`.

`selectViewedSchedule` supplies the calendar and saved course panel with the
chosen section snapshots. Found applies the draft's alternatives; Saved uses
the stored sections, even when current course data has changed. `selectSavedPlan`,
`selectViewedCourse` and `selectViewedSection` supply the rest of the read-only
view. Draft edits and Found paging do nothing in Saved. Leaving the planner
clears Saved mode without changing the URL or draft. `share` is reserved and
left untouched by view navigation.

Choosing a saved plan from the menu opens it for editing. There is no separate
Edit this plan button. Start a new plan in the same menu resets the current
term's draft to empty courses and default preferences. It asks before replacing
unsaved work and keeps every saved plan. Saving the fresh draft creates a
separate plan.

All saved plans leaves the course sidebar, preferences and summary panel empty.
Viewing the list never changes the working draft. A selected registration sheet
still shows that plan's courses, preferences and summary.

### How it behaves

- The planner page mounts a five-step guide popover on the first visit. It
  points to the real term, search, lecture professor, preferences and schedule
  controls. The popover stays beside its target and leaves it usable. Next
  waits for a loaded term on step 1 and a course on step 2. The remaining
  steps are optional. The professor step selects the current lecture course,
  or the first planned course with lectures, without changing its professor.
  With no lectures, navigation skips that step. Progress totals change only
  when navigating. The availability text reflects the current settings.
  Finish is always available on the last step. Only a completed engine answer
  with zero schedules shows the no-match text. Saved mode hides the guide.
  Tutorial status uses `goatplan:tutorial:v1`, outside drafts and saved plans.
  A restored plan with courses bypasses the guide. Skip, Close and Finish keep
  every plan setting. Navigation checks whether guide progress can be stored.
  The first failed write replaces the open step’s copy once. Later steps use
  their usual copy. An info banner stays visible for the visit, including after
  the guide closes. Restored drafts and saved snapshots show a success banner
  listing the settings they kept. Loading placeholders and the empty-calendar
  prompt stay hidden while the guide is open.

- **Solving.** Every change to the plan waits 200 ms (`SOLVE_DELAY_MS`) for
  more changes, then sends one request built by the pure `buildRequest(state)`.
  Only the answer to the latest request is kept. An empty plan clears the answer
  without asking the engine.
- **Drafts.** The working plan (courses, preferences, locks, sort and picked
  alternatives) is saved after every change, per term, in localStorage under
  `goatplan:draft:v1:<termId>`; the last term is under `goatplan:term:v1`.
  Switching terms keeps each term's own draft. Broken or old data is ignored,
  and courses or sections a term no longer has are dropped on load.
- **Loading a term** downloads its file once. The page parses it for the UI,
  and the file's bytes are handed to the engine worker without a copy
  (`takeTermBuffer` then `EngineClient.loadTerm(termId, buffer)`). The worker
  only fetches the file itself when it has no bytes, which happens when you
  switch back to a term you opened before.

## Data and engine

- `lib/data`: `loadTermIndex()` and `loadTerm(termId)` (cached), the types from
  `data-format.md`, and formatting helpers for times, days, seats, section
  labels, instructors and the Rate My Professors link. Use them instead of
  formatting by hand. Search, section display and seat math are TypeScript.
  - `lectureInstructors` supplies the professor picker and validates selections.
    `lecturesByProfessor` uses trimmed, case-insensitive full names to keep
    request generation, local choices, and diagnosis previews consistent.
    Requests send matching lecture IDs in `preferences.anyOf`; published course
    options still determine the linked labs and discussions.
    Professor changes preserve all section locks. If a restored professor has no
    matching lectures, the store reports no matches itself, because an empty
    `anyOf` list would leave that course unrestricted. It runs one extra solve
    without those courses' professor rules; when that gives schedules, the
    0-result answer offers `clearAnyOf` ("Allow any professor") for each such
    course, in course order, with that solve's count. The extra solve's
    schedules are never shown.
    The student can clear the professor in the picker, including when the course
    no longer has lectures. Conflicting locks stay visible with Unlock controls.
  - `formatDataDate(generatedAt)` writes a term's `generatedAt` as
    "Oct 25, 2026" in the student's time zone, for "Course data updated", or
    `null` when it can't be read.
  - `roomName(location)` shortens a room to its building and number
    ("Higgins Labs 230"). Show the full location as a `title` where it's cut.
  - `meetingSpans`, `spansOverlap` and `meetsRules` check whether sections
    overlap or pass the preferences, with the engine's 5-minute slots.
- `components/ui/courseColors.ts`: `courseSlot(courses, code)` and
  `COURSE_COLORS`, so the calendar blocks, the sidebar swatches and the "No set
  time" items use the same color for a course.
- `lib/engine`: the engine runs in a Web Worker behind `EngineClient`. Features
  don't call it: the store owns the engine and puts its answers in `response`.
  The types follow `engine-api.md`.

## Phone layout

Phone is in scope at 375 px. The breakpoint is `--breakpoint-tablet: 40rem`
(640 px): below it the app renders the phone shell, above it the
tablet/desktop layout. The JS hook `usePhoneViewport()`
and the Tailwind `tablet:` prefix both read this boundary.

### Phone shell (`components/shell/`)

`PlannerShell` (`components/shell/PlannerShell.tsx`) is the client component
that wires the responsive shell together. It uses `usePhoneViewport()` to
choose which layout to mount:

- **Phone (< 640 px):** single column, 16 px side gutter (`px-(--size-phone-gutter)`).
  The sidebar and side details panel are not mounted. Instead:
  - `YourCoursesDisclosure` replaces the sidebar. A collapsible button
    "Your courses (N)" with the term picker, search and course list inside.
    Open by default when empty, collapses once the first course lands.
  - `PhoneCourseScreen` replaces the side details panel. A full screen,
    opened only by a deliberate tap on a course chip or calendar block. It
    renders `CourseDetailsPanel` with `PhoneCourseDetails` for the course:
    a card per chosen section and "Change lecture" / "Change lab" lists.
  - `DataUpdated` moves to `phoneFooter`, below the schedule.
- **Tablet+ (≥ 640 px):** the `Sidebar` and side `DetailsPanel` mount as
  usual, and phone-only slots are null.

Only one of the sidebar and the disclosure is mounted at a time, so
tutorial-target IDs never duplicate in the DOM.

`AppShell` (`components/shell/AppShell.tsx`) is the presentational shell that
accepts all the slots (`sidebar`, `phoneDisclosure`, `phoneSheet`,
`phoneFooter`, etc.) and renders them in the right positions. The `main`
element has `min-w-0 flex-1` and the schedule section has `overflow-hidden`,
so nothing can force horizontal scroll.

### Day view (`components/schedule/DayCalendar.tsx`)

On phone, `ScheduleView` renders `DayCalendar` instead of `PlanCalendar`
(the 5-column week grid). The day calendar has:

- **Day tabs:** `role="tablist"` with Mon–Fri (plus Sat/Sun when they have
  classes). Arrow-key navigation (Left, Right, Home, End) with roving
  tabindex. Selected tab is `bg-accent-soft text-accent`; a 4 px dot marks
  days with classes.
- **Day panel:** a vertical scrolling list of class blocks, sorted by start
  time. Each block shows course code, section code (truncated), time range
  and room (`break-words`). Tapping a block selects the course+section and
  opens the phone details sheet.
- **Free-time dividers:** between consecutive items when the gap is > 10 min,
  showing "{N}h free" or "{N} min free".
- **Empty day:** "No classes on {Day}" centered in muted text.
- **No set time:** the `NoTimeStrip` lists online/unscheduled sections below
  the day's classes.

The pure logic lives in `dayView.ts`: which days to show, the default-open
day (today if it has classes, else the next day with classes, weekends wrap
to Monday), and how to map classes and blocked times into day items. Covered
by `DayCalendar.test.tsx` and `dayView.test.ts`.

### Toast (`components/ui/Toast.tsx`)

A fixed-position status region for short messages with one or more action
buttons (`actions`):

- Position: `fixed inset-x-16 bottom-16 z-10`, centered. Full width on phone
  (`w-full`), content-width on tablet (`tablet:w-auto`).
- `role="status" aria-live="polite" aria-atomic="true"`, so screen readers
  announce changes without interrupting.
- Auto-dismisses after 6 seconds (`DURATION = 6000`). The timer pauses on
  hover or focus and resumes with the remaining time.
- Each action button (e.g. "Undo") calls its handler; the handler clears the
  message.
- `PlannerToast` (`components/shell/`) renders the one Toast last in
  `PlannerShell`, so it's the final Tab stop and sits above the shell at `z-10`.
- It shows "Removed {code} · Undo", or after a calendar drag "Blocked Mon–Wed
  12–1 PM · Name it · Undo" or "Unblocked Mon 12:30–1:30 PM · Undo". Name it
  opens the Block a time form filled in with the drawn days and times. It only
  shows when those times fit the form's 7 AM–10 PM choices. The message only
  names days that really changed. After Undo or the Name it form, focus moves to
  the Block a time button.

### Blocking time by dragging

On the week grid and the phone calendar, the student can drag on empty space
to block a time on one or more days. The time snaps to half hours, is at least
30 minutes long, and stays inside the visible range. A drag that starts on a
blocked time removes that time instead, and splits a block when it only covers
part of it. After adding, blocks on the same day with the same name that
overlap or touch become one. The plan solves once, when the pointer is
released.

- A mouse or pen drag starts after the pointer moves 4 px. A finger has to
  press and hold for 400 ms first, so swipes and scrolling still work. Scrolling
  is only blocked once the hold starts. Escape cancels a drag.
- Class blocks still open their details, and a click on empty space does
  nothing.
- The pure math is in `components/schedule/dragBlock.ts`, the pointer handling
  in `useBlockDrag.ts`, and the rectangle in `DragSelectionBox.tsx`. Day columns
  are marked with `data-drag-day`.
- Keyboard and screen reader users keep using the Block a time button and
  form. The calendar has a polite live region that says what changed on
  release ("Blocked Mon–Wed 12–1 PM"), and stays quiet when nothing did.
- The saved plan view is read-only, so dragging is off there.

### Bottom Sheet (`components/ui/Sheet.tsx`)

`Sheet` is a native `<dialog>` modal with two sides:

| Side | Use | Sizing |
|---|---|---|
| `right` | Desktop/tablet details, "Choose a lab" | `max-w-[calc(100vw-32px)]`, slide from right |
| `bottom` | Phone details, phone "Block a time" | `w-full max-w-none`, `max-h-[85dvh]`, `rounded-t-panel`, slide up |

Both sides share:
- Focus trap (`keepFocusInside`): heading-first focus when opening.
- Backdrop scrim overlay.
- `motion-reduce:transition-none` for reduced-motion preference.
- Close via Escape, Close button, or tap outside.

The `bottom` variant adds safe-area padding for the iPhone home indicator:
`pb-[max(20px,env(safe-area-inset-bottom))]`.

Phone uses `Sheet side="bottom"` for `BlockTimeButton`: the "Block a time"
form, which uses `Dialog` on tablet but `Sheet side="bottom"` on phone.

## Checks before a PR

From the repo root:

```bash
npm run lint
npm run test        # Vitest
npm run build
npm run test:e2e    # Playwright; builds and starts the app itself
```

### Ports when agents run at the same time

Every agent works in its own git worktree and uses its own port, set with the
`PORT` environment variable (default 3000):

| Agent | `PORT` | Dev server | Production build during `test:e2e` |
|---|---|---|
| search | 3001 | http://localhost:3001 | 4001 |
| schedule | 3002 | http://localhost:3002 | 4002 |
| prefs | 3003 | http://localhost:3003 | 4003 |
| plans | 3004 | http://localhost:3004 | 4004 |

```bash
PORT=3002 npm run dev       # the dev server on 3002
PORT=3002 npm run test:e2e  # tests: production build on 4002, dev pages on 3002
```

- `npm run dev` runs `next dev`, which reads `PORT` itself. Set it in the
  shell, not in `.env`: Next reads the port before it loads `.env`.
- `test:e2e` builds the app and serves it on `PORT + 1000` for the main
  specs. It always starts that server fresh and fails clearly if the port is
  taken.
- The `/dev` page specs use the dev server on `PORT`. If your `npm run dev` is
  already running there, the tests use it; otherwise they start one. Next
  allows only one dev server per worktree, so don't start a second one on
  another port.
- Every worktree has its own `.next`, `e2e/results` and `e2e/screenshots`, so
  parallel runs don't touch each other's files.

Take screenshots of your screens at 1440, 834 and 375 px (save them in
`apps/web/e2e/screenshots/`, which git ignores) and check each one before
you open a pull request.
