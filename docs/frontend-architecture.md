# Frontend architecture

GoatPlan's web app is one planner page plus a "Sections to register" page, built
with Next.js (App Router), TypeScript and Tailwind in `apps/web`. The lead owns
the shared parts: layout, store, data, engine and UI primitives. Four feature
agents build the features in their own folders, in parallel. This page says who
owns what, what the shared store offers, and how to ask for a change to a
shared file.

Read it together with `CLAUDE.local.md` (the rules),
[design/frames.md](design/frames.md) and the screen notes in
[design/screens/](design/screens/), [data-format.md](data-format.md) and
[engine-api.md](engine-api.md).

## Folder map

All paths are under `apps/web/src/`.

```
app/
  layout.tsx            lead     root layout, DM Sans
  page.tsx              lead     the planner page: places every feature component
  globals.css           lead     design tokens (docs/design/tokens.md)
  plans/                plans    /plans, "Sections to register"
  dev/                  lead     /dev/ui and /dev/engine; 404 in production
components/
  tutorial/             lead     first-visit guide and its browser-local persistence
  ui/                   lead     primitives: Button, ButtonLink, IconButton, Badge, Chip, Toggle,
                                 Select, TextInput, Card, Dialog, Sheet, Tooltip; course colors
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

| Agent | Owns | Components already in the page | Main designs |
|---|---|---|---|
| **search** | `components/courses/` | `TermPicker` (sidebar, under the logo), `CourseSearchPanel` (sidebar: search box, results, "Your courses"), `TermBreadcrumbs` (above the title) | `div.app.md`, `div.app-3.md`, `div.app-4.md`, `div.app-5.md`, course rows in `div.app-10.md` |
| **schedule** | `components/schedule/` | `ScheduleView` (calendar card), `ScheduleSwitcher` (next to the title), `ScheduleSummary` (line under the title), `ScheduleBanner` (full-width banner above the calendar) | `div.app-1.md`, `div.app-2.md`, `div.app-6.md`, `div.app-7.md`, `div.app-13.md`, `div.app-17.md` to `div.app-20.md` |
| **prefs** | `components/preferences/`, `components/sections/` | `PreferencesBar` (the Preferences row), `CourseDetailsPanel` (details panel: section choices, Lock/Unlock, professor, "Needs attention" and fixes), `ChooseAlternativeSheet` | `div.app-3.md` (panel), `div.app-7.md` to `div.app-11.md`, `div.app-15.md`, `div.app-16.md`, `div.app-20.md` |
| **plans** | `app/plans/`, `components/plans/`, `lib/plans/` | `PlanActions` (header, right side), `RegistrationSheet` and `RegistrationSummary` (on `/plans`) | `div.app-12.md`, `div.app-22.md` |

- Keep the file names and exports of the placeholders; the page imports them.
- Components that need state or events become client components (`"use client"`).
- Saved plans have **their own storage** in `lib/plans/` (keys start with
  `goatplan:plans:`), not the planner store. The store only keeps the working
  draft.
- `/plans` (`app/plans/page.tsx`) belongs to the plans agent and reuses the
  shared shell and the other agents' sidebar components.
- Sort options: the store keeps three sort presets (`SORT_PRESETS`), but the
  prefs agent shows only the sort options present in the design PNGs. Today
  that's "Fewest early classes" (`div.app-6.png`). The others stay hidden until
  a design shows them.
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
| `sortPreset` | The Sort choice: `fewestEarly`, `fewestGaps` or `fewestDays` (labels and weights in `SORT_PRESETS`). The menu shows only the options in the design PNGs. |
| `alternatives` | Per schedule (by `scheduleKey`) and per course, the same-time alternative the student picked. |
| `response` | The engine's last answer, success or engine error; `null` when there are no courses. |
| `scheduleIndex` | Which schedule in `response.schedules` is shown. |
| `solveStatus` | `idle`, `waiting` (the 200 ms pause after a change), `solving`, `done` or `error`. |
| `solveError` | Why the engine gave no answer at all (for example, the worker crashed). Engine errors are in `response`. |
| `selectedCourse` | The course the details panel shows and "Your courses" marks. The first course once a term loads; not saved in the draft. |
| `selectedSection` | The section whose calendar blocks are selected, after a click on a block; `null` otherwise. |
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
| `removeCourse(code)` | Removes a course with its locks and picked alternatives. If it was selected, the next course (or the one before) is selected. |
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
| `applyFix(fix)` | Applies a fix from `response.diagnosis.fixes`: start later, clear blocked times, allow full sections, unlock or drop a course. |

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
  every plan setting. Failed storage writes leave a visible reminder that the
  guide may return on a later visit. Loading placeholders and the empty-calendar
  prompt stay hidden while the guide is open. See [the guide reference](design/screens/div.app-29.md).
  Issue 17 covers screenshots at 1440 px; 834 px is an agreed exception.

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
    matching lectures, the store reports no matches without sending the request
    to the engine. An empty `anyOf` list would leave that course unrestricted.
    The student can clear the professor in the picker, including when the course
    no longer has lectures. Conflicting locks stay visible with Unlock controls.
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
|---|---|---|---|
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

Take screenshots of your screens at 1440 and 834 px (save them in
`apps/web/e2e/screenshots/`, which git ignores) and compare them with the
PNGs in `docs/design/screens/`. Then run the ui-reviewer agent.
