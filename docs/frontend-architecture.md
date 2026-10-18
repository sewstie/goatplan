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
  ui/                   lead     primitives: Button, IconButton, Badge, Chip, Toggle, Select,
                                 TextInput, Card, Dialog, Sheet, Tooltip
  shell/                lead     AppShell, Sidebar, WorkspaceHeader, Placeholder, PlannerBootstrap
  courses/              search   term picker, course search, "Your courses", breadcrumbs
  schedule/             schedule calendar, schedule switcher, summary line, banner
  preferences/          prefs    the Preferences row
  sections/             prefs    details panel, lock controls, choose-alternative sheet
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

### State

| Field | What it is |
|---|---|
| `terms` | Published terms that haven't ended (New York time), for the term picker. |
| `termId` | The chosen term's id, like `"2027-C"`. |
| `term` | The chosen term's parsed file (courses and sections); `null` while it loads. |
| `termStatus` | `idle`, `loading`, `ready` or `error`. Plan actions do nothing until `ready`. |
| `termError` | Why the term couldn't load, in plain English. |
| `courses` | The chosen course codes, in the order they were added. |
| `preferences` | `{ startsAfter, blocked, onlyOpen }`. The defaults follow the first-visit design: 9:00 AM, no blocked times, only open sections. A blocked time can have a `label`, the name the student gave it ("Work"); it is saved with the draft but never sent to the engine. |
| `locks` | Course code → the section ids locked for that course. |
| `sortPreset` | The Sort choice: `fewestEarly`, `fewestGaps` or `fewestDays` (labels and weights in `SORT_PRESETS`). The menu shows only the options in the design PNGs. |
| `alternatives` | Per schedule (by `scheduleKey`) and per course, the same-time alternative the student picked. |
| `response` | The engine's last answer, success or engine error; `null` when there are no courses. |
| `scheduleIndex` | Which schedule in `response.schedules` is shown. |
| `solveStatus` | `idle`, `waiting` (the 200 ms pause after a change), `solving`, `done` or `error`. |
| `solveError` | Why the engine gave no answer at all (for example, the worker crashed). Engine errors are in `response`. |

### Actions

| Action | What it does |
|---|---|
| `init()` | Loads the term list and opens the term used last time, or else the first upcoming one. |
| `setTerm(termId)` | Switches term: downloads the file once (page and engine), restores that term's draft and solves. |
| `addCourse(code)` | Adds a course from the current term (ignored if unknown or already added). |
| `removeCourse(code)` | Removes a course with its locks and picked alternatives. |
| `setPreferences(changes)` | Changes any of `startsAfter`, `blocked` and `onlyOpen`. |
| `lockSection(course, sectionId)` | Keeps only schedules that use that section (the course must be in the plan). |
| `unlockSection(course, sectionId)` | Removes that lock. |
| `setSortPreset(preset)` | Changes the Sort order. |
| `chooseAlternative(course, sectionIds)` | Picks a same-time alternative in the current schedule. It doesn't solve again. |
| `nextSchedule()` / `previousSchedule()` | Pages through the schedules, stopping at the ends. |
| `applyFix(fix)` | Applies a fix from `response.diagnosis.fixes`: start later, clear blocked times, allow full sections, unlock or drop a course. |

Selectors and helpers that come with it: `selectSchedules`,
`selectCurrentSchedule`, `selectChosenSections` (course → the section ids taken
in the current schedule, with picked alternatives), `scheduleKey`,
`buildRequest`, `SORT_PRESETS`, `DEFAULT_PREFERENCES`, `MAX_SCHEDULES`.

### How it behaves

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
