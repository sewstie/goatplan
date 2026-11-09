# Planner and saved schedules

The planner at `/` builds schedules for published terms. It reads normalized
course files, keeps a separate browser draft per term, and searches in a worker.
Changing the draft does not change degree history or a saved plan snapshot.

## Courses, sections and preferences

Choose a term, search by course code or title, and add courses. Section choices
come from precomputed valid options: a lecture can require a linked lab or
discussion. Picking a professor restricts the lectures; it does not choose a
professor for every associated section. Locks require particular section IDs.

The start-time rule, blocked times and Only open sections constrain schedules.
The six sort choices rank schedules by Best overall, Fewest early classes,
Latest start, Earliest finish, Most days off or Most compact. Most compact ranks
by free minutes between classes, not a count of breaks. Ranking uses the same
overall weights so score totals remain comparable.

The switcher pages through returned schedule patterns. Several same-time section
options can share a pattern; picking one need not trigger another solve. Search
can stop at the engine's step budget, in which case the totals are lower bounds
and the app does not claim to have found every possible schedule.

Course details show meetings, section-specific information, seats, professor
links and description text. Rate My Professors is above Check OSCAR. Neither
link supplies a numeric score in the UI.

## When no schedule fits

The calendar can preview the courses involved while the diagnosis explains which
rule or overlap prevents a schedule. Proposed changes are tested before being
offered. Start-time, blocked-time, professor and lock changes preserve the rest
of the request unless the action explicitly names a combined change.

The frontend also checks other lecture professors for a course with a selected
professor. Successful alternatives appear in Try another professor; other
changes follow below. Selecting a fix changes the draft and solves again.
An uncertain capped search is shown separately from a proven clash.

## Blocked times

Block a time toggles calendar drawing. Drag to add time, or begin on an existing
block to erase it. Changes snap to half hours. The form remains available for
keyboard input and times outside the visible grid. Named overlapping/touching
blocks merge when their names match. Erasing can split a block.

A click outside drawing opens a blocked-time popover with Rename and Remove.
Ctrl/Command selection supports removing several blocks together. Undo restores
the previous list. Private block labels stay in the local draft and saved plans,
but are omitted from engine requests and shared links.

## Live seats

The planner refreshes seat counts through a cached server endpoint. Freshness
appears in the sidebar or phone footer. On failure, daily counts remain and Retry
is available. There is no Workday reminder below the status. Saved/shared views
keep their own snapshots. See [live seats](seats.md) for validation and cache rules.

## Save, open and register

Save records the displayed plan with section snapshots in local browser storage.
Saved plans and drafts have separate keys. Found shows generated schedules;
Saved shows snapshots. Opening a saved plan for editing is an explicit action.
Starting a new plan preserves saved plans and can ask before replacing unsaved
work.

`/plans` lists saved plans and their Sections to register. A registration sheet
uses stored section details even when the published term has ended. It does not
register a student with WPI or submit any external form.

## Share and export

Share creates a versioned URL-fragment payload containing the term, selected
sections, relevant settings and professor choices. It omits degree history and
private blocked-time labels. A shared view does not overwrite the recipient's
draft. Missing courses/sections are reported instead of silently substituted.
A shared link is not a server-hosted backup of the sender's section snapshots.

Export opens calendar review, then downloads an `.ics` file. Timed sections use
term dates or section-specific dates. Sections without set times are listed as
left out. The default excludes known no-class dates and applies alternate-day
schedules from `lib/calendar/term-calendar-data.json`, with New York time and
daylight-saving handling. A term missing curated calendar data warns that
holidays were not removed. Import into a calendar remains the student's action.

## Add to My degree

On tablet/desktop, Add to degree opens a review panel with the displayed courses
and an explicit Add button. On phone, Add to My degree is a direct action in More
actions. Both add planned history records for the plan's term and keep existing
entries. The action is hidden in shared/temporary previews so it cannot copy
an unrelated background draft. They report duplicates and storage failures. Subsequent planner edits
do not synchronize those records. See [degree tracking](degree-tracking-sheet.md).

## Phone and keyboard behavior

Below 768 px the planner has separate schedule, search, preferences and course
screens. The schedule stays mounted while another screen is open. The calendar
uses the same week-grid component with phone-specific density and bounds.
Share and Export live in More actions. Their bottom sheets close with Escape,
the Close control or backdrop dismissal. Focus returns directly to More actions,
and the menu closes; it must not return focus to a now-hidden Export button.
Repeated native-close tests still expose intermittent focus loss; see
[current project checks](launch-check.md#local-integration-check-november-8-2026)
for the latest evidence and remaining verification.

Tablet/desktop uses anchored popovers for quick actions and the side panel for
course details. Labels, keyboard activation, focus restoration and responsive
layouts are covered by component and browser tests. Light/Dark affects screen
presentation; print remains Light.
