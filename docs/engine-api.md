# Engine API

The website (through WebAssembly) and the command-line tool talk to the engine
the same way. They load a term once, then send requests as JSON text and get
JSON text back. This page is the contract. The TypeScript types in the web app
copy it, so change this page first and the code second.

This is version 1, and it's frozen. Nothing in it gets renamed, removed or
changes meaning. A change like that becomes version 2.

`preferences.anyOf`, the `notAnyOf` diagnosis count, the `clearAnyOf` fix and
its `startsAfter`, `sort.lateCutoff`, `sort.perLateMinute`, `score.lateMinutes`,
`sort.primary` and the score fields `firstStart`, `lastEnd`, `averageStart`,
`averageEnd` and `freeMinutes` are additive fields in version 1. Existing fields
and requests keep their meaning. A request without `sort.primary` ranks exactly
as before.

```cpp
goatplan::Engine engine;
std::string loaded = engine.loadTermJson(termJson);
std::string response = engine.handle(requestJson);
```

In JavaScript the same two calls are `loadTerm` and `handle` on the
WebAssembly module, see [engine/README.md](../engine/README.md). The
command-line tool uses `engine.loadTerm`, which throws `TermLoadError` instead
of answering with an error.

A few rules hold for every call:

- `loadTermJson` and `handle` never throw. Every problem comes back as `{"ok": false, "error": {...}}`.
- Sections are named by their IDs from the term file, never by positions. IDs
  are stable, so the website can save them in plans.
- Every request and response carries `"version": 1`. If the format changes,
  the number goes up, and old saved requests fail loudly instead of quietly
  meaning something else.
- The engine protects the browser. `maxSchedules` is cut to 500 and
  `stepBudget` to 50,000,000, whatever the request asks for.

Times are always minutes after midnight, so 600 is 10:00 AM and 780 is 1:00 PM.

## Loading a term

`loadTermJson` takes the text of a term file (see [data-format.md](data-format.md))
and answers with the term's ID and how many courses it has:

```json
{ "ok": true, "version": 1, "termId": "2026-B", "courses": 589 }
```

If the text isn't a usable term file, the answer is a `badTerm` error, and the
term that was loaded before, if any, stays loaded.

## Request

```json
{
  "version": 1,
  "courses": ["PH 1120", "MA 1022", "CS 2102"],
  "preferences": {
    "startsAfter": 600,
    "blocked": [{ "day": "Mon", "start": 720, "end": 780 }],
    "onlyOpen": true,
    "locked": { "PH 1120": ["PH 1120-BL01"] },
    "anyOf": { "PH 1120": ["PH 1120-BX03", "PH 1120-BX07"] }
  },
  "sort": { "primary": "days", "earlyCutoff": 600, "perEarlyMinute": 3, "lateCutoff": 1020, "perLateMinute": 5, "perGapMinute": 1, "perDay": 60 },
  "limits": { "maxSchedules": 50, "stepBudget": 5000000 }
}
```

Only `version` and `courses` are required. Leave anything else out, or set it
to `null`, to get the default. Fields the engine doesn't know are ignored.

| Field                     | Type                       | Default   | Meaning |
| ------------------------- | -------------------------- | --------- | ------- |
| `version`                 | number                     | required  | Must be `1`. |
| `courses`                 | list of course codes       | required  | At least one. If a code is repeated, only the first one counts. |
| `preferences.startsAfter` | 0 to 1440                  | `0`       | Skip options with any meeting that starts earlier. `0` turns it off. |
| `preferences.blocked`     | list of `{day, start, end}`| `[]`      | Skip options that touch these times. `day` is `Mon` … `Sun`, and `0 <= start < end <= 1440`. |
| `preferences.onlyOpen`    | true or false              | `false`   | Skip options with a full or waitlisted section. |
| `preferences.locked`      | course code → section IDs  | `{}`      | For that course, only keep options that include every one of these sections. |
| `preferences.anyOf`       | course code → section IDs  | `{}`      | For that course, only keep options that include at least one listed section. A missing or empty list adds no rule. |
| `sort.primary`            | `earlyMinutes`, `firstStart`, `lastEnd`, `days` or `freeMinutes` | `null` | The measure to rank by first, see [Order of schedules](#order-of-schedules). `null` ranks by `score.total`. Any other value is a `badRequest`. |
| `sort.earlyCutoff`        | 0 to 1440                  | `600`     | Class time before this counts as early. |
| `sort.perEarlyMinute`     | 0 to 10000                 | `3`       | Cost of each early minute. |
| `sort.perGapMinute`       | 0 to 10000                 | `1`       | Cost of each minute between classes. |
| `sort.lateCutoff`         | 0 to 1440                  | `1440`    | Class time after this counts as late. |
| `sort.perLateMinute`      | 0 to 10000                 | `0`       | Cost of each late minute. |
| `sort.perDay`             | 0 to 10000                 | `60`      | Cost of each day on campus. |
| `limits.maxSchedules`     | whole number               | `200`     | How many schedules to send back. At most 500. |
| `limits.stepBudget`       | whole number               | `5000000` | How long the search may run. At most 50,000,000. |

Every course code in `courses`, `locked` or `anyOf` has to exist in the
loaded term. Every section listed in `locked` or `anyOf` has to belong to the
course it's listed under. When both preferences apply, an option must include
all locked sections and at least one section from the nonempty `anyOf` list.

## Response

```json
{
  "ok": true, "version": 1, "termId": "2026-B",
  "total": 1234, "patterns": 87, "capped": false, "steps": 4211, "elapsedMs": 3.2,
  "schedules": [
    {
      "score": { "total": 240, "earlyMinutes": 60, "gapMinutes": 120, "lateMinutes": 0, "days": 4,
                 "firstStart": 540, "lastEnd": 950, "averageStart": 600, "averageEnd": 860, "freeMinutes": 100 },
      "courses": [
        {
          "code": "PH 1120",
          "sections": ["PH 1120-BL01", "PH 1120-BX03"],
          "openSeats": 12,
          "alternatives": [["PH 1120-BL01", "PH 1120-BX03"], ["PH 1120-BL01", "PH 1120-BX07"]]
        }
      ]
    }
  ],
  "diagnosis": null
}
```

`total` counts every schedule that fits, including ones that differ only in
which section you take at the same time. `patterns` counts the different weekly
timetables those make, and each entry in `schedules` is one of them.

`capped` is true when the search ran out of steps, so `total` and `patterns`
are only a lower bound. `steps` is how much searching it took. `elapsedMs` is
the time spent filtering, searching and diagnosing, and changes from run to run.

`schedules` comes best first, at most `limits.maxSchedules` of them, in the
[order of schedules](#order-of-schedules) below. In each one, `courses` follows
the order of the request, with repeats removed. For each course:

- `sections` lists the section IDs of the option shown.
- `openSeats` is the fewest open seats among those sections, or `null` when the
  data has no seat numbers for them.
- `alternatives` lists every option that meets at exactly the same times, as
  section ID lists, including the one shown. The shown one is the one with the
  most open seats.

### Score

Every number in `score` is in minutes, apart from `total` and `days`. Classes
with no set time don't count toward any of them, and when no class in a
schedule has a set time, they're all `0`.

| Field          | Meaning |
| -------------- | ------- |
| `total`        | The cost from `sort`: early, late and gap minutes times their cost, plus `perDay` for each day. Lower is better. |
| `earlyMinutes` | For each day that starts before `sort.earlyCutoff`, the time from its first start to the cutoff, added up. |
| `lateMinutes`  | For each day that ends after `sort.lateCutoff`, the time from the cutoff to its last end, added up. |
| `gapMinutes`   | The time without class between each day's first start and last end, added up. Every break counts, even the 10 minutes between back-to-back classes. |
| `days`         | The days with class. |
| `firstStart`   | The week's earliest class start. |
| `lastEnd`      | The week's latest class end. |
| `averageStart` | The average of each day's first start, over the days with class, rounded to the nearest minute (halves up). |
| `averageEnd`   | The same for each day's last end. |
| `freeMinutes`  | The breaks between two classes on the same day that are longer than 10 minutes, added up. |

### Order of schedules

The engine compares schedules one way, both to keep the best
`limits.maxSchedules` while it searches and to order the ones it sends back.
So the first schedule is the best of every schedule the search checked, not
only of the ones returned. The first step that differs decides:

1. `sort.primary`, when it's set. `firstStart` is better when it's higher;
   `earlyMinutes`, `lastEnd`, `days` and `freeMinutes` are better when lower.
2. Only for `firstStart`: then `averageStart`, higher is better. Only for
   `lastEnd`: then `averageEnd`, lower is better. Because these are averages
   over the days with class, a schedule with fewer days isn't helped or hurt
   by its days off.
3. `score.total`, lower is better.
4. Section order: course by course in request order, the schedule whose
   option comes earlier in the term file's `options` list comes first.

Without `sort.primary`, or with `null`, the order starts at step 3, as it did
before `sort.primary` existed.

When `capped` is true, the search stopped before checking everything, so
`sort.primary` ranks only the schedules it found. A schedule that's better on
that measure may exist among the ones it didn't reach.

## Diagnosis

`diagnosis` is `null` whenever `total` is above 0. When `total` is 0 it says why:

```json
"diagnosis": {
  "unsure": false,
  "emptyCourses": [{ "code": "PH 1120", "optionsInData": 363,
    "removed": { "notLocked": 0, "notAnyOf": 0, "notOpen": 4, "startsTooEarly": 359, "blocked": 0 },
    "latestStartsAfter": 780 }],
  "clashingPairs": [],
  "minimalClash": [],
  "fixes": [{ "kind": "relaxStartsAfter", "startsAfter": 780, "schedules": 18, "capped": false },
            { "kind": "dropCourse", "course": "PH 1120", "schedules": 40, "capped": false }]
}
```

It goes through these questions in order and stops at the first one that finds
something:

1. `emptyCourses`: courses with no options left. `removed` says how many options
   each preference took out. Each option is counted once, under the first rule
   that removed it, in this order: `notLocked`, `notAnyOf`, `notOpen`,
   `startsTooEarly`, `blocked`. `notAnyOf` counts options that contain none of
   that course's listed sections. `optionsInData: 0` means the course has
   no options at all, maybe because it has no set meeting times.
   `latestStartsAfter` is the latest `startsAfter` that would keep at least one
   option for this course, or `null` when `startsAfter` wasn't the problem.
2. `clashingPairs`: two courses that never fit together, whatever sections you
   pick.
3. `minimalClash`: when every pair fits but all of them together don't, a
   group of courses that still can't all fit, where every course in it is
   needed for the clash.

A list that no step filled is empty (`[]`), never missing.

### The shapes of `clashingPairs` and `minimalClash`

This section writes down what the version 1 engine already returns. It
documents existing behavior; version 1 is unchanged.

- `clashingPairs` is a list of pairs. Each pair is a list of exactly two course
  codes, `[first, second]`, in the order the courses appear in the request
  (repeats removed). Every clashing pair is listed, so one course can be in
  several pairs. Pairs are sorted by the position of their first course, then
  their second.
- `minimalClash` is a list of course codes, in request order. The engine starts
  with all the requested courses and leaves each one out in turn, in request
  order. If the others still can't fit without it, it stays out. So leaving out
  any one course of the result lets the rest fit, but it isn't always the
  smallest such group. If one of these checks runs out of steps, that course
  stays in the group.

Real answers from B Term 2026. `["AE 2310", "CS 2102", "AE 2330"]` gives a
clashing pair:

```json
"clashingPairs": [["AE 2310", "AE 2330"]],
"minimalClash": []
```

`["AR 1100", "AREN 2004", "RBE 2020"]` fits pair by pair, but not all three:

```json
"clashingPairs": [],
"minimalClash": ["AR 1100", "AREN 2004", "RBE 2020"]
```

Then `fixes` lists changes that were actually tried and do give schedules.
Preference changes come first and dropping a course last. Within each, the
fixes that give the most schedules come first. `capped: true` means `schedules`
is only a lower bound.

| `kind`             | Extra field   | What to change in the request |
| ------------------ | ------------- | ----------------------------- |
| `relaxStartsAfter` | `startsAfter` | Set `preferences.startsAfter` to it. It's the latest time that still gives schedules, and `0` means turn the rule off. |
| `clearBlocked`     |               | Remove all `preferences.blocked` times. |
| `allowFull`        |               | Set `preferences.onlyOpen` to false. |
| `unlock`           | `course`      | Remove that course from `preferences.locked`. |
| `clearAnyOf`       | `course`, sometimes `startsAfter` | Remove that course from `preferences.anyOf`. When `startsAfter` is there, also set `preferences.startsAfter` to it, like `relaxStartsAfter`. Tried like `unlock`, and suggested only when it gives schedules. |
| `dropCourse`       | `course`      | Remove that course from `courses`. |

`clearAnyOf` is first tried on its own, for every course with a nonempty
`anyOf` list. If that gives no schedules, `preferences.startsAfter` is set, and
the course's `anyOf` took out some of its options (`removed.notAnyOf` above 0),
the engine looks for the latest `startsAfter` that gives schedules once that
course's `anyOf` is removed. If there is one, the fix carries it as
`startsAfter`. Nothing else is combined with it: blocked times, `onlyOpen` and
locks stay as they are. A `clearAnyOf` without `startsAfter` means the start
time stays as it is. Like any preference change, it's sorted before dropping a
course.

From C Term 2027, `["MA 1024", "CS 2022", "PH 1110"]` with the PH 1110 lectures
of one professor in `anyOf` and `startsAfter: 720` gives no schedules, and
removing the `anyOf` alone still gives none, so the fix moves the start time
too:

```json
{ "kind": "clearAnyOf", "course": "PH 1110", "startsAfter": 660, "schedules": 10, "capped": false }
```

`unsure: true` means the search ran out of steps before finding anything, so the
engine doesn't actually know whether a schedule exists. Everything else is empty
then. Show something like "Too many combinations to check, try fewer courses".

The diagnosis always names courses by code, never by position.

## Errors

```json
{ "ok": false, "version": 1,
  "error": { "code": "unknownCourse", "message": "No course PH 9999 in 2026-B", "detail": "PH 9999" } }
```

`message` is plain English for people. `detail` is for code: the course code,
section ID, field or version the error is about, or `null`. It's always a
string or `null`; the version comes back as JSON text, so version 2 gives
`"2"` (existing behavior, written down with the diagnosis shapes above).

| `code`               | When                                                         | `detail` |
| -------------------- | ------------------------------------------------------------ | -------- |
| `noTerm`             | `handle` was called before a term was loaded.                | `null` |
| `badTerm`            | `loadTermJson` got text that isn't a usable term file, like broken JSON or a missing field. | `null` |
| `badRequest`         | Broken JSON, a missing field, a wrong type or a value out of range. The message names the field. | The field, like `preferences.blocked[0].end`, or `null` for broken JSON. |
| `unsupportedVersion` | `version` isn't 1.                                           | The version sent. |
| `unknownCourse`      | A course code isn't in the loaded term.                      | The code. |
| `unknownSection`     | A section ID in `locked` or `anyOf` isn't one of that course's sections. | The section ID. |
| `internal`           | A bug in the engine.                                         | `null` |

## Audit

A degree audit checks a student's courses against a requirements file and
reports which lines are filled, which checks are met, and what's still missing.
It's an additive part of version 1: existing requests and responses keep their
meaning.

### Recognizing an audit request

A request is an audit when it has a `"requirements"` key at the top level.
Existing requests never have this key, so every request that worked before
still works the same way. An audit doesn't need a loaded term.

### Audit request

The engine contains no tracking sheet. The caller loads a selected sheet from
the registry and sends its JSON in `sheet`. Parsed rules are cached per engine
and sheet id. Omitting `sheet` reuses rules already loaded by that engine;
an unknown id returns `unknownRequirements`. A changed document replaces the
cached rules for that id. A malformed sheet or mismatched id returns
`badRequest` with detail `sheet`, leaving the previous rules usable.

The engine matches filtered lines, "only one of" sets, cross-lists, WPE slots,
manual items and the free elective pool, then works out the checks and what each
candidate would close.

```json
{
  "version": 1,
  "requirements": "cs-2030",
  "taken": [
    { "code": "CS 1101", "credits": 3 },
    { "code": "MA 1021", "credits": 3 },
    { "code": "HU 3900", "credits": 3, "apIb": true }
  ],
  "planned": [
    { "code": "CS 2102", "credits": 3 }
  ],
  "manual": ["iqp-1", "wpe-sports"],
  "candidates": [
    { "code": "CS 3733", "credits": 3 }
  ]
}
```

| Field          | Type                          | Default    | Meaning |
| -------------- | ----------------------------- | ---------- | ------- |
| `version`      | number                        | required   | Must be `1`. |
| `requirements` | string                        | required   | The ID of a requirements file, e.g. `"cs-2030"`. |
| `sheet`        | tracking-sheet object          | cached     | Rules for `requirements`. Its `id` must match. Send it on every app audit so a restarted worker has the rules. |
| `taken`        | list of course objects         | `[]`       | Courses the student has completed. |
| `planned`      | list of course objects         | `[]`       | Courses the student is taking or plans to take. |
| `manual`       | list of manual item IDs        | `[]`       | Confirmed manual items, such as `"iqp-1"` or `"wpe-sports"`. Unknown IDs are ignored. |
| `candidates`   | list of course objects         | `[]`       | Courses to test for gap-closing. |

Each course object has:

| Field     | Type    | Default  | Meaning |
| --------- | ------- | -------- | ------- |
| `code`    | string  | required | The course code, e.g. `"CS 2102"`. |
| `credits` | number  | required | Credit value of the course. |
| `apIb`    | boolean | `false`  | Whether the course was earned through AP or IB. |

Codes use uppercase subjects of two to four letters, one space, and a
three- or four-digit number with an optional uppercase suffix. Credits must
be finite and nonnegative. Invalid fields return `badRequest` with their
field path. Optional lists may be omitted or `null` to use their defaults.

A repeated code counts once; later copies are ignored and show as "Extra" in
the response. Cross-listed courses (e.g. CS 2022 and MA 2201) are one course
with several codes; listing both codes counts once, and the unused code shows
as "Extra". The order of the lists doesn't change the response.

### Audit response

```json
{
  "ok": true,
  "version": 1,
  "sections": [
    {
      "name": "Computer Science",
      "done": 4,
      "planned": 1,
      "total": 10,
      "lines": [
        { "id": 17, "label": "Computer Science", "state": "done", "course": "CS 2102" },
        { "id": 22, "label": "Computer Science", "state": "planned", "course": "CS 3733" },
        { "id": 23, "label": "Computer Science", "state": "empty", "course": null }
      ]
    }
  ],
  "checks": [
    { "id": "systems", "label": "Systems area", "state": "met", "courses": ["CS 4513"] },
    { "id": "hua-depth", "label": "Humanities depth", "state": "check", "courses": ["EN 1001", "EN 1002", "EN 2201"] }
  ],
  "freeElectives": {
    "creditsDone": 3,
    "creditsPlanned": 0,
    "creditsTotal": 9,
    "courses": ["PE 1001"]
  },
  "extra": ["CS 1101"],
  "candidateResults": [
    { "code": "CS 3733", "closesLines": [24], "closesChecks": ["design"] }
  ]
}
```

**Sections.** Each section from the requirements file appears once. `done` and
`planned` count the filled lines in that section. `total` is the number of
lines. A line with sub-slots counts each slot instead, so Wellness and Physical
Education has a `total` of 4. Each line has:

| Field   | Type              | Meaning |
| ------- | ----------------- | ------- |
| `id`    | number            | The line number from the requirements file. |
| `label` | string            | A display label for the line. |
| `state` | `"done"`, `"planned"`, `"partial"` or `"empty"` | Whether the line is filled by a taken course, a planned course, or nothing. `"partial"` means only some sub-slots are filled. |
| `course`| string or `null`  | The course code filling this line. `null` if it's empty, has sub-slots, was filled by a manual item, or is a pool line already finished by the same course. |
| `subSlots` | list, only on lines with sub-slots | One `{ "course", "state" }` per slot. Taken classes come first, then confirmed sports with a `null` course, then planned classes. |

A pool line is `"done"` or `"planned"` once the pool's credits reach it, and
`course` names the course that finished it.

**Checks.** Each check from the requirements file appears once.

| Field    | Type                                 | Meaning |
| -------- | ------------------------------------ | ------- |
| `id`     | string                               | The check ID from the requirements file. |
| `label`  | string                               | A display label for the check. |
| `state`  | `"met"`, `"planned"`, `"not-met"` or `"check"` | Whether taken courses satisfy the check, planned courses are needed to satisfy it, it isn't satisfied, or it needs manual verification ("Check this yourself"). |
| `courses`| list of course codes                  | The courses behind this check. Empty when the state is `"not-met"`. |

| Check | State |
| ----- | ----- |
| `systems`, `theory`, `design`, `social` | `"met"` or `"planned"` when an area course of 3 or more credits fills a Computer Science line. `courses` then lists every such course the student has, even one that ended up in the pool. |
| `social` | With no CS course on a line, a non-CS course of 3 or more credits (GOV/ID 2314, GOV 2315, IMGD 2000, RBE 3100) gives `"check"`. It doesn't use a Computer Science line, and can fill another line it qualifies for. |
| `science-depth` | `"met"` or `"planned"` when 2 BB/CH/GE/PH courses on Science lines share a subject. `courses` lists the first 3 BB/CH/GE/PH courses on those lines. |
| `hua-depth` | Looks at the courses on lines 1–5, so the seminar on line 6 doesn't count. With 3 in one grouping it's `"check"` until `hua-depth-confirmation` is sent, then `"met"` or `"planned"`. Below 3, courses in more than one grouping give `"check"`, and otherwise it's `"not-met"`. |
| `hua-breadth` | With a depth grouping, `"met"` or `"planned"` when a course on lines 1–5 is outside it, `"check"` when every course is in the modern languages grouping, and otherwise `"not-met"`. Without one, `"check"` once any course is on those lines, and otherwise `"not-met"`. |
| `hua-ap-ib-limit` | Only 1 AP/IB course may fill a humanities line. Any others are kept off those lines and listed in `courses`, with `"check"`. Otherwise `"met"` with no courses. |
| `residency` | `"check"` once the request has any taken or planned course, and otherwise `"not-met"`. A course's code can't show whether it was taken at WPI. |
| `ma-1000-limit` | Always `"met"`, because only 4 lines accept 1000-level courses. `courses` lists the ones on Mathematics lines. |
| `grad-equivalence` | Always `"check"`, because the 2-for-3 rule can't be worked out here. `courses` lists the graduate courses on Computer Science lines that count as 4000+. Each counts as one course, with no bonus. Empty means no course is affected. |

**Free electives.** A credit pool. Courses from 0.75 to under 3 credits, and
unmatched courses of any size, go here by credit, taken courses first.
`creditsDone`, `creditsPlanned` and `creditsTotal` track progress, and the two
counts stop at the total. A course that starts below the total still counts in
full as a course, even if it tips the pool over.

**Extra.** Courses that don't count toward any line or the free elective pool:
courses beyond a full pool, repeated codes (second and later copies), the
unused code of a cross-list, 0-credit courses, and other courses under 0.75
credits. WPE classes under 0.75 credits still fill WPE slots. The list is sorted.

**Candidate results.** For each candidate course, the lines and checks it would
newly close if added. A candidate closes a gap if adding it raises the number
of filled lines outside free electives, or meets an unmet check. Candidates are
tested on a copy of the current state, one at a time, as planned courses.

`closesLines` lists the lines that are filled only with the candidate. When a
swap moves another course, that's the line the other course moved to. A WPE
class that fills another slot on line 7 lists line 7. `closesChecks` lists the
checks the candidate actually meets, so it's not enough to change a state to
`"check"`: a second humanities grouping below 3 courses closes nothing, and
neither does anything for `residency`.

### Matching rules

The matcher assigns courses to lines to fill the most lines possible.

- It's a max-flow over courses, "only one of" sets and lines. The set limit is
  one capacity in the network, so only one course from a set can fill a line.
- Taken courses match first. Planned courses augment afterward, so a planned
  course never unseats a taken one.
- Within each group, courses that matter to a check go first. Because an
  augmenting path never unmatches a course, those courses stay in their section
  whenever possible. The first course for each area, the first 2 from the leading
  science subject, and the first 3 from the leading humanities grouping go ahead
  of everything. Next come the first humanities course outside a depth grouping,
  other BB/CH/GE/PH courses and 4000+ area courses.
- The first of those groups goes by code. After that, subjects go in reverse
  letter order and then by code, for example PSY before GOV. It's an arbitrary
  rule that keeps the order fixed.
- A listed course that's cross-listed with an area course tries the Computer
  Science line first when it's the course that area depends on.
- Lines with the same filter are interchangeable, so courses are laid out on them
  afterward without changing what's filled. An area course goes on its area line,
  such as CS 3013 on line 22, and the others take the plain lines first, in the
  order above.
- A cross-listed course is one course with several codes. Listing both codes
  counts once. It stays on a line for a code the student listed, and moves to a
  line for its other code only if that fills more lines. A line shows the listed
  code that fits it, or else the code the student listed.
- A course takes the narrowest open line that fits, such as MA 2621 on line 39
  before line 34. Matching uses the shortest change that fills a line, so courses
  only move when they have to.
- Order is fully fixed, so the same input always gives the same output.
- Courses of 3 or more credits fill one line. WPE classes fill WPE slots.
  Other courses from 0.75 to under 3 credits and unmatched courses go to the
  free elective pool by credit. 0-credit courses count toward nothing.
- The `wpe-sports` manual item fills the WPE slots that taken classes leave
  open, and any class left over goes to the pool. Other manual items fill their
  own lines.
- A repeated code counts once; later copies show as "Extra".
- An `apIbLimit` check caps how many AP/IB courses can fill lines in its
  section. Courses are counted in seating order, and the ones past the cap
  never connect to that section's lines.

### Audit errors

An audit request uses the same error format as other requests. Additional
error codes:

| `code`                | When                                            | `detail` |
| --------------------- | ----------------------------------------------- | -------- |
| `unknownRequirements` | The `requirements` ID isn't recognized.          | The ID sent. |

All other errors (`badRequest`, `unsupportedVersion`) apply as before.
`noTerm` is never returned for an audit, because audits don't need a loaded
term.

## Requirements file format

A requirements file describes one major and class year. The first file is
`cs-2030`, Computer Science for the Class of 2030.

The file holds five things: **sections**, **lines**, **checks**,
**cross-lists** and **manual items**.

Sheets live in `apps/web/src/lib/degree/sheets/`. The registry records official
sources, official line numbers, beta status and student verification. Only the
requested sheet is dynamically imported. CI validates every registered sheet
against `degree-rules.schema.json` and checks references, totals and cross-lists.
Overlapping checks do not add units to the numbered lines.

Filters use `courses`, `subjects`, `subjectMinLevel`, `manual` or `any`.
`additionalCourses` and `excludedCourses` belong to the filter. `priority`
preserves allocation order; `advanced` marks courses needing equivalence review.
Checks use `area`, `disciplineCount`, `groupDepth`, `groupBreadth`, `apIbLimit`,
`residency`, `levelLimit`, `graduateEquivalence`, `minCourses` or `manual`.
Section references, grouping order, language exceptions and confirmation ids
come from the document. A manual check stays unresolved until its confirmation
is supplied. The engine does not select rules by major name.

### Sections

A section groups related lines. It has a name and an ordered list of line IDs.
Sections appear in the order of the official tracking sheet.

### Lines

Each line is a slot that one course can fill. A line has:

| Field      | Meaning |
| ---------- | ------- |
| `id`       | A unique number, matching the tracking sheet's line numbers. |
| `section`  | Which section this line belongs to. |
| `filter`   | A rule for which courses can fill this line (see below). |
| `label`    | A display label. |

Line filters:

- **Subject list:** the course's subject must be in the list. For example, lines 8–9 accept ECON, ENV, GOV, PSY, SD, SOC, SS, STS, DEV and ID 2050.
- **Subject and level:** the course must be in a subject at or above a level. For example, CS 2000+ means any CS course numbered 2000 or above. Code levels are parsed carefully: a 3-digit number such as CS 502 is graduate level and counts as 4000+. Suffixes such as CS 210X are handled.
- **Exact codes:** the course must be one of a listed set. For example, MA 2621 or MA 2631.
- **Manual:** the line is filled by a manual item, not a course.

For the CS 2030 sheet, the 45 lines are:

| Lines  | Section                | Filter |
| ------ | ---------------------- | ------ |
| 1–5    | Humanities and Arts    | Any HUA subject |
| 6      | Inquiry Seminar        | HU 3900 or HU 3910 |
| 7      | Wellness / PE          | 4 slots of 1/12 unit each |
| 8–9    | Social Science         | ECON, ENV, GOV, PSY, SD, SOC, SS, STS, DEV, ID 2050 |
| 10–12  | IQP                    | Manual |
| 13–15  | Free electives         | A credit pool of 9 credits |
| 16     | Computer Science       | CS 1101, CS 1102 or CS 2000+ |
| 17–25  | Computer Science       | CS 2000+ |
| 26–30  | Computer Science       | CS 4000+ or graduate, except CS 5007 |
| 31–33  | MQP                    | Manual |
| 34–37  | Mathematics            | MA 1000+ |
| 38     | Mathematics            | MA 2000+ |
| 39     | Mathematics            | MA 2621 or MA 2631 |
| 40     | Mathematics            | MA 2611 or MA 2612 |
| 41–43  | Science                | BB, CH, GE, PH |
| 44–45  | Science                | Note 4 disciplines, except RBE 3100 and BME 1004 |

Lines 22–25 are the area lines. They match as ordinary CS 2000+ lines, and the
four CS areas are checks (see below).

CS 2119 is excluded from CS lines. "Only one of" sets are CS 2301/2303,
CS 2102/210X/2103 and CS 1101/1102. Only one course from each set can fill a
CS line; the others can still count toward free electives.

### Checks

A check is a rule that doesn't consume a line. It has an ID, a label and a
condition. Check states are `"met"`, `"not-met"` or `"check"` ("Check this
yourself").

Examples for CS 2030:

- **CS areas (4 checks):** Theory, Design, Systems, Social Implications. Each
  passes when a matched CS course in that area is present. A non-CS Social
  Implications course (GOV/ID 2314, GOV 2315, IMGD 2000, RBE 3100) meets the
  Social check without counting toward CS units and can fill another line it
  qualifies for. That reading shows `"check"`.
- **Science discipline:** 2 of the matched BB/CH/GE/PH courses must be from
  one discipline.
- **Humanities depth:** the grouping with at least 3 courses. Breadth needs a
  course outside it. All-language students pass with `"check"`. Depth also
  needs the student's confirmation. Spanning more than one grouping shows
  `"check"`.
- **AP/IB limit:** only 1 AP/IB course fills a humanities line. Any others go
  to another line they fit or the free electives, and the check lists them.
- **Residency:** 8 units at WPI. Shows `"check"` once typed courses are
  present.

### Cross-lists

A cross-list entry names two or more codes that are the same course (e.g.
CS 2022 and MA 2201). When a student lists both, only one counts; the other
shows as "Extra". The matcher treats cross-listed codes as one course and places
it where it helps most, even if the student listed only one of the codes.

### Manual items

A manual item is a line that can't be filled by a course code. It has an ID
and a label. The student confirms it with a tick box.

Examples: each IQP line, each MQP line, WPE slots (including the sports
option), and humanities depth confirmation.

The restored engine accepts only `cs-2030`. Loading other tracking sheets is a
separate change.
