# UI copy reference

Wording used in the app, grouped by feature. Each entry shows the rule and an example.

## Sort descriptions

The Sort menu shows six presets. Each has a label (the accessible name) and a short description.

| Preset | Label | Description |
|---|---|---|
| Best overall | Best overall | A balance of start time, gaps and days |
| Fewest early classes | Fewest early classes | Fewer classes before 10 AM |
| Latest start | Latest start | Classes start as late as possible each day |
| Earliest finish | Earliest finish | Classes end as early as possible each day |
| Most days off | Most days off | Fewer days on campus |
| Most compact | Most compact | Less free time between classes |

**Latest start** and **Earliest finish** were added in ticket 05. Their descriptions are:

- Latest start: "Classes start as late as possible each day"
- Earliest finish: "Classes end as early as possible each day"

## Schedule badges – free time between classes

The badge reads `score.freeMinutes`, the same value "Most compact" sorts by. When `freeMinutes` is missing (a plan saved before the engine sent it), it is worked out from the meetings: sum every same-day gap longer than 10 minutes, treating overlapping meetings as one stretch.

| freeMinutes | Badge text |
|---|---|
| 0 | No gaps between classes |
| 1–59 | {n} min free between classes |
| 60 or more (rounded to nearest 30 min) | {h} h free between classes |

Examples:

- 0 → "No gaps between classes"
- 40 → "40 min free between classes"
- 60 → "1 h free between classes"
- 75 → "1.5 h free between classes"
- 150 → "2.5 h free between classes"
- 180 → "3 h free between classes"

The old 30-minute gap count badge ("No gaps", "2 gaps") is removed. The free-time badge keeps its place in the badge order and its pill look.

## Diagnosis – "Ways to fix it"

Labels used in the "Ways to fix it" section when no schedule fits.

### Fix labels

| Fix kind | Condition | Label |
|---|---|---|
| `relaxStartsAfter` | `startsAfter > 0` | Change to {time} |
| `relaxStartsAfter` | `startsAfter === 0` | Clear start restriction |
| `clearBlocked` | | Clear blocked times |
| `allowFull` | | Show full sections |
| `clearAnyOf` | no `startsAfter` | Allow any professor for {course} |
| `clearAnyOf` | `startsAfter > 0` | Allow any professor for {course} and change to {time} |
| `clearAnyOf` | `startsAfter === 0` | Allow any professor for {course} and clear start restriction |
| `unlock` | single lock | Unlock {section code} |
| `unlock` | multiple locks | Unlock {course} |
| `dropCourse` | | Remove {course} |

Times use the same `formatTime` format as the start-time preference: "9:00 AM", "11:00 AM", "12:00 PM".

### Count line

Each fix button shows a schedule count below its label:

- **Exact:** "{n} schedule fits" / "{n} schedules fit"
- **Capped (lower bound):** "At least {n} schedules fit"

## Undo remove

When a course is removed, the toast reads:

| Element | Text |
|---|---|
| Message | Removed {code} |
| Action | Undo |

Example: "Removed MA 1024 · Undo"

## Course data updated date

Shows when the selected term's data was last generated, from `generatedAt` in the term list. Muted ink at 9 px / 400, in a `<time>` element with the full ISO timestamp.

| Rule | Text |
|---|---|
| Template | Course data updated {date} |
| Example | Course data updated Oct 25, 2026 |

The date is formatted as "MMM D, YYYY" in the student's time zone (e.g. "Oct 25, 2026"). Nothing shows before the term list loads. The date changes when the selected term changes.

## Phone day calendar

Copy used in the mobile day view (below 640 px).

| String | Context |
|---|---|
| `No classes on {day}` | Day panel when the selected day has no timed classes or blocked times. `{day}` is the full weekday name, e.g. "Friday". |
| `{n} free` | Divider between consecutive classes with a break longer than 10 minutes. `{n}` is a formatted duration, e.g. "1 h", "30 min", "1 h 30 min". |
