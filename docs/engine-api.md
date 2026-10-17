# Engine API

The website (through WebAssembly) and the command-line tool talk to the engine
the same way. They load a term once, then send requests as JSON text and get
JSON text back. This page is the contract. The TypeScript types in the web app
copy it, so change this page first and the code second.

This is version 1, and it's frozen. Nothing in it gets renamed, removed or
changes meaning. A change like that becomes version 2.

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
    "locked": { "PH 1120": ["PH 1120-BL01"] }
  },
  "sort": { "earlyCutoff": 600, "perEarlyMinute": 3, "perGapMinute": 1, "perDay": 60 },
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
| `sort.earlyCutoff`        | 0 to 1440                  | `600`     | Class time before this counts as early. |
| `sort.perEarlyMinute`     | 0 to 10000                 | `3`       | Cost of each early minute. |
| `sort.perGapMinute`       | 0 to 10000                 | `1`       | Cost of each minute between classes. |
| `sort.perDay`             | 0 to 10000                 | `60`      | Cost of each day on campus. |
| `limits.maxSchedules`     | whole number               | `200`     | How many schedules to send back. At most 500. |
| `limits.stepBudget`       | whole number               | `5000000` | How long the search may run. At most 50,000,000. |

Every course code, both in `courses` and in `locked`, has to exist in the
loaded term. Every locked section has to belong to the course it's listed under.

## Response

```json
{
  "ok": true, "version": 1, "termId": "2026-B",
  "total": 1234, "patterns": 87, "capped": false, "steps": 4211, "elapsedMs": 3.2,
  "schedules": [
    {
      "score": { "total": 240, "earlyMinutes": 60, "gapMinutes": 120, "days": 4 },
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

`schedules` comes best first (lowest `score.total`), at most
`limits.maxSchedules` of them. In each one, `courses` follows the order of the
request, with repeats removed. For each course:

- `sections` lists the section IDs of the option shown.
- `openSeats` is the fewest open seats among those sections, or `null` when the
  data has no seat numbers for them.
- `alternatives` lists every option that meets at exactly the same times, as
  section ID lists, including the one shown. The shown one is the one with the
  most open seats.

## Diagnosis

`diagnosis` is `null` whenever `total` is above 0. When `total` is 0 it says why:

```json
"diagnosis": {
  "unsure": false,
  "emptyCourses": [{ "code": "PH 1120", "optionsInData": 363,
    "removed": { "notLocked": 0, "notOpen": 4, "startsTooEarly": 359, "blocked": 0 },
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
   that removed it, in the order shown. `optionsInData: 0` means the course has
   no options at all, maybe because it has no set meeting times.
   `latestStartsAfter` is the latest `startsAfter` that would keep at least one
   option for this course, or `null` when `startsAfter` wasn't the problem.
2. `clashingPairs`: two courses that never fit together, whatever sections you
   pick.
3. `minimalClash`: when every pair fits but all of them together don't, the
   smallest group of courses that still can't all fit.

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
| `dropCourse`       | `course`      | Remove that course from `courses`. |

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
section ID, field or version the error is about, or `null`.

| `code`               | When                                                         | `detail` |
| -------------------- | ------------------------------------------------------------ | -------- |
| `noTerm`             | `handle` was called before a term was loaded.                | `null` |
| `badTerm`            | `loadTermJson` got text that isn't a usable term file, like broken JSON or a missing field. | `null` |
| `badRequest`         | Broken JSON, a missing field, a wrong type or a value out of range. The message names the field. | The field, like `preferences.blocked[0].end`, or `null` for broken JSON. |
| `unsupportedVersion` | `version` isn't 1.                                           | The version sent. |
| `unknownCourse`      | A course code isn't in the loaded term.                      | The code. |
| `unknownSection`     | A locked section ID isn't one of that course's sections.     | The section ID. |
| `internal`           | A bug in the engine.                                         | `null` |
