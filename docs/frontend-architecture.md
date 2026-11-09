# Frontend architecture

GoatPlan uses Next.js App Router, strict TypeScript, React, Tailwind CSS and
Zustand. The current dependency versions live in `apps/web/package.json`.
The browser runs the C++ scheduler and generic audit through WebAssembly in a
worker. Most product behavior is TypeScript.

Read this with [development](development.md), [the data format](data-format.md)
and [the engine API](engine-api.md).

## Routes

| Route | Responsibility |
| --- | --- |
| `/` | Editable term planner, saved snapshots and shared-link previews |
| `/plans` | Saved plans and Sections to register |
| `/degree` | Major selection, degree tracking, Plan ahead and Course map |
| `/data/catalog.json` | Persistent degree catalog from `data/catalog.json` |
| `/api/seats` | Server-side live seat proxy and cache |
| `/dev/ui`, `/dev/engine` | Development-only UI and engine pages |

My degree is linked in the main navigation without a browser invitation or
release flag. All five registered Class of 2030 sheets are selectable. Their
registry status remains beta and their student verification metadata is null.
The individual Suggestions tab is disabled by `SUGGESTIONS_ON = false`.
Course maps are enabled, and CS's Suggest next terms action remains available
inside Plan ahead independently of that flag.

## Modules

Paths below are relative to `apps/web/src/`.

| Path | Responsibility |
| --- | --- |
| `app/` | Route composition, layout, DM Sans, tokens and server endpoints |
| `components/ui/` | Buttons, fields, dialogs, sheets, drawers, popovers and focus utilities |
| `components/shell/` | Responsive shell, top bar, theme, seat status and planner bootstrap |
| `components/phone/` | Phone schedule, search, preferences and course screens |
| `components/courses/` | Published-term search and chosen-course list |
| `components/schedule/` | Calendar, schedule browsing, previews and blocked-time editing |
| `components/sections/` | Section choices, professor controls, locks and diagnosis actions |
| `components/preferences/` | Availability controls and sort presets |
| `components/plans/` | Plan saving, opening, saved views and registration sheets |
| `components/share/`, `components/calendar/` | Shared links and calendar export |
| `components/degree/` | Degree UI, history entry, plan grid and planner transfer |
| `components/courseMap/` | Background maps, course selection and map details |
| `components/tutorial/` | First-plan guide and its persistence |
| `lib/store/` | Working draft, solves, selection, live seats and planner view state |
| `lib/engine/` | EngineClient, worker protocol, host and contract types |
| `lib/data/` | Term loading, seat loading/merging, section rules and formatting |
| `lib/degree/` | History, source state, sheet registry, matching and recommendations |
| `lib/courseMap/` | Curated background expressions, map layouts and arrow routing |
| `lib/plans/`, `lib/share/`, `lib/calendar/` | Plan persistence, share codec and ICS generation |
| `lib/diagnosis/` | Diagnosis wording and calendar previews |
| `lib/theme.ts`, `lib/analytics/` | Theme subscription and optional event reporting |

## Boundaries and ownership

Search, section presentation, saved plans and Sections to register are
TypeScript. Components use the engine only through `lib/engine/EngineClient`.
The engine performs schedule searches and diagnoses, plus generic audits and
candidate checks against caller-supplied tracking sheets. It does not contain
major-specific rule files.

The lead owns app layout/page composition, `lib/store`, `lib/engine`, `lib/data`
and `components/ui`. Feature agents request changes to those shared files.
Keep components small and in separate files. Use theme tokens for colors and
shared formatting helpers for section labels, times, seats and rooms.

Repository instructions prohibit edits to `engine/`, `scripts/`,
`apps/web/public/data/` and `apps/web/public/engine/` during frontend work.
Data and engine builds are separate maintenance workflows; this guide does not
change those boundaries.

## Planner state and requests

`getPlannerStore()` returns the shared Zustand store. `usePlanner(selector)`
reads it, and `usePlannerStore()` exposes its API. Tests can inject a real store
through `PlannerProvider`. Select stable values; object or array selectors need
`useShallow` when they create a new value on every call.

`PlannerBootstrap` initializes the store on the planner route. Degree tracking
does not initialize the planner. `lib/store/types.ts` is the complete state and
action reference.

| State | Purpose |
| --- | --- |
| `termId`, `term`, `terms`, `termStatus`, `termError` | Published term and load state |
| `courses`, `preferences`, `locks`, `professorByCourse`, `sortPreset`, `alternatives` | Working draft |
| `response`, `scheduleIndex`, `solveStatus`, `solveError` | Latest accepted engine response and displayed schedule |
| `selectedCourse`, `selectedSection`, `lastChosenSections` | Section details and selection continuity |
| `savedPlans`, `savedPlanId`, saved selection fields | Saved snapshot view |
| `temporaryPlan` | Shared preview or another temporary view |
| `seatsUpdatedAt`, `seatRefresh` | Current draft's seat freshness |
| `professorFixes`, `checkingProfessors` | Tested alternative-professor fixes |
| `drawing`, `removedCourse`, `blockedChange` | Unsaved interaction and Undo state |

New drafts start with no courses, Any time, no blocked times and only open
sections. Restored drafts keep their saved settings. The main actions add/remove
courses, select sections, change preferences/professors, lock/unlock sections,
change sort, browse schedules, pick section options and apply tested fixes.
`openPlan` replaces a draft explicitly; `refreshSeats` refreshes only seat data.

A draft change waits 200 ms before solving. `buildRequest` deduplicates courses,
includes only relevant locks, removes blocked-time labels, translates selected
lecture professors to `preferences.anyOf`, and applies a sort preset. All six
presets share Best overall weights and vary the primary ranking measure.
The app requests at most 200 returned schedules. The engine has its own caps.

An empty draft clears the answer without solving. Superseded answers are ignored.
EngineClient queues worker operations and rejects requests replaced by newer
loads or solves. Audits have their own request path.

## Data and seats

`loadTermIndex` and `loadTerm` cache successful JSON requests. Failed requests can
be retried. Raw term bytes can be transferred through `takeTermBuffer` to avoid
a second fetch by the worker.

The planner requests live seats alongside a term load and refreshes every minute
while visible. `withLiveSeats` accepts only matching, sufficiently recent seat
snapshots. Changed seats are loaded into the engine and solved again. Failed
refreshes fall back to the daily file. Saved/shared snapshots keep their original
section data. See [live seats](seats.md) for the server cache and status text.

Degree search uses the persistent catalog, so courses can be recorded without
published schedules. Individual course details and offering hints can load
published term files independently of the planner.

## Professors and diagnosis

`lectureInstructors` and `lecturesByProfessor` use trimmed, case-insensitive full
names. Selecting a professor restricts lectures, including co-taught lectures,
while course options determine the required labs and discussions. Changing a
professor preserves section locks. A restored professor with no matching lecture
is handled explicitly; an empty `anyOf` list must not silently allow everyone.

When no schedule fits, engine diagnosis explains empty courses, pair clashes or
a larger clash. The frontend also tests up to six other lecture professors per
selected course, keeping the rest of the request fixed. Successful choices show
under Try another professor, followed by other tested fixes. These frontend
`switchProfessor` fixes do not extend the engine's version 1 fix schema.
Diagnosis and section hover previews are display state, not saved schedule edits.

Instructor rows show Rate My Professors first and Check OSCAR beneath it. The
app links to those services; it does not fetch or display numeric ratings.

## Plans, sharing and storage

| Storage | Contents |
| --- | --- |
| `goatplan:term:v1` | Last planner term |
| `goatplan:draft:v1:<termId>` | Per-term working draft |
| `goatplan:plans:v1:plan:<id>` | Saved plan and section snapshots |
| `goatplan:plans:v1:current:<termId>` | Plan associated with a term's draft |
| `goatplan:history:v1` | Version 2 degree history and per-sheet state |
| `goatplan:degree:projects` | Four-year-plan project reservations |
| `goatplan:theme:v1` | Light or Dark preference |
| `goatplan:tutorial:v1` | First-plan guide state |

Selecting Found shows generated schedules; Saved shows snapshots. Draft edits
and Found paging do not alter a saved snapshot. Opening a saved plan for editing
is explicit and can ask before replacing unsaved work. Starting a new plan keeps
saved plans. Registration sheets remain usable for ended terms because saved
plans contain section snapshots.

Shared links encode a schedule in the `p=` URL fragment. Loading a preview does
not overwrite a draft. Saving or editing a shared copy requires an explicit
action. Shared blocked times do not reveal private labels. Calendar export uses
`lib/calendar` and term calendar data to build an `.ics` file. Downloads do not
change the schedule or degree history.

## My degree

`DegreeSource` owns history, sheet selection and audits separately from the
planner. `CourseGaps` runs candidate audits for search badges and the disabled
individual-suggestions UI. History is shared across majors; pins and manual
confirmations are stored per sheet. Humanities path is shared across majors.

The Sheet view has tiles and a List alternative. Plan ahead places history in a
four-year grid, supports moving courses and project reservations, and exposes CS
next-term recommendations. Course map uses curated background expressions for
all five registered majors. New visitors choose a major before entering history.

Opening an empty field lists only courses that meet its requirement, across all
terms. Named CS areas use approved area lists, including listed non-CS social
courses. Rows show usual observed terms on the right. The chosen term controls
when a course is added, not the candidate list. CS choices can be pinned to their
area line; external social courses are not pinned to CS credit lines.

Planner courses reach history only through Add to degree. Tablet/desktop opens a
review panel with the course list and an explicit Add button. The phone menu's
Add to My degree row applies directly and displays the result in place. Both use
`useAddPlanToDegree` and `addPlanMessage`, preserve existing entries, add planned
records for the displayed plan's term, and report storage failures. They never
keep the planner and history automatically synchronized. Add to degree is hidden
in temporary/shared previews, where the background draft may be unrelated.

See [tracking](degree-tracking-sheet.md), [major selection](degree-major-selection.md)
and [recommendations](course-recommendations.md) for the data and selection rules.

## Responsive layout and focus

The tablet breakpoint is 48rem (768 px). At that width and above, `PlannerShell`
mounts `AppShell`, a sidebar and section details. Below it, `PhonePlanner` mounts
schedule, search, preferences or course screens. The schedule screen stays
mounted but hidden during a trip to another phone screen, retaining scroll and
guide state. IDs for active tutorial controls are not duplicated.

`PhoneTopBar` has the goat mark, Planner/My degree navigation and the term picker.
The phone schedule header has saved-plan controls and a More actions menu; Save
sits beside the schedule browser. `PlanCalendar` uses `WeekCalendar` on both
phone and desktop; it delegates to `SwipeWeekCalendar` on phone, with density
and visible bounds adapted to the layout.
The old one-day calendar/disclosure design is not the mounted phone planner.

Native dialogs and sheets use `useModalDialog`. They focus a heading or marked
control on open, trap focus where required, and restore focus on close or
unmount. `AnchoredPanel` uses a popover on tablet/desktop and a bottom sheet on
phone. `BarMoreMenu` supplies `ModalReturnFocusContext`, so its dialogs return
directly to More actions. It observes dialog closing/removal to close the menu,
avoiding delayed focus transfers to a hidden menu item.

## Calendar editing

Block a time toggles drawing mode. Dragging adds or erases half-hour ranges and
solves once on release. The form remains available for keyboard users. Escape
cancels a drag or leaves drawing mode. Saved plans are read-only.

`dragBlock.ts` owns range math. `useBlockDrag` owns pointer handling, and
`useHeldRange` holds the calendar range while drawing. Overlapping/touching times
with the same name merge. Erasing can split a block. Undo restores the previous
blocked list. A named time keeps its label in local storage, but labels are
removed from engine requests and shared schedules.

Outside drawing mode, blocked times open a popover with Rename and Remove.
Ctrl/Command-click or the keyboard equivalent selects several blocks; Delete
removes them together, and Escape clears the selection. Short blocks use compact
text and full accessible labels. Class/course selection opens section details;
keyboard selection can move focus into details and Escape returns it.

## Theme, feedback and analytics

`app/globals.css` defines semantic tokens and Dark overrides. The root layout
reads the saved theme before paint; `lib/theme.ts` subscribes to the document
attribute. Light is the default. Printing uses Light without changing the saved
screen theme. See [theme behavior](degree-dark-theme.md).

Feedback links open the repository's GitHub issue form. `lib/analytics/track`
sends a small named event only in production, with
`NEXT_PUBLIC_UMAMI_WEBSITE_ID` set and `window.umami` already available. The
current root layout does not install an Umami script. The event helper does not
prove production delivery or create analytics infrastructure.

## Verification

Use the commands in [development](development.md). Logic tests sit beside source
files. Browser tests use frozen data, including mocked live-seat responses, and
capture 1440, 834 and 375 px views. Keep keyboard focus, labels and small-width
behavior in scope. Do not replace a failing expectation with a new baseline
without reviewing the behavior it protects.
