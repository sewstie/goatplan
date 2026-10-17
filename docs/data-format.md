# Course data format

`scripts/normalize.mjs` is the translator between WPI's data and the app. WPI's
file is built for WPI's website: one flat row per section, with times as text
like `"M-T-R-F | 9:00 AM - 9:50 AM"`, seats as `"85/120"`, HTML in
descriptions, and labs tied to lectures only through a cluster ID. The engine
and UI need something cleaner: courses containing their sections, times as
numbers, and the valid lecture-plus-lab combinations already worked out.

```
data/raw/courselistings.json   →   normalize.mjs   →   apps/web/public/data/
(WPI's format, one row                               ├── index.json     (list of terms)
 per section, every term)                            ├── 2026-B.json
                                                     ├── 2027-C.json
                                                     └── 2027-D.json
```

It runs after `fetch-courses.mjs` in the daily workflow. It parses everything
once, so the browser and the C++ engine never deal with WPI's text formats.

Only current and upcoming terms get a file. See
[Which terms are published](#which-terms-are-published) for why a file shows
up or disappears.

## A term file

Here's a real example: AE 2320 in C Term. Its one lecture and three labs come
out as one course with four sections and three options.

```json
{
  "term": { "id": "2027-C", "name": "C Term", "season": "Spring", "year": 2027,
            "start": "2027-01-13", "end": "2027-03-05" },
  "generatedAt": "2026-10-11T21:26:05Z",
  "courses": [
    {
      "code": "AE 2320",
      "subject": "AE",
      "title": "Introduction to Orbital Mechanics",
      "credits": 3,
      "level": "Undergraduate",
      "description": "An introductory course that covers the fundamentals of space flight...",
      "sections": [
        {
          "id": "AE 2320-CL01", "code": "CL01", "type": "lecture",
          "status": "open", "enrolled": 85, "capacity": 120,
          "waitlist": { "taken": 0, "capacity": 20 },
          "instructors": ["Ye Lu"],
          "delivery": "in-person",
          "meetings": [
            { "days": ["Mon","Tue","Wed","Thu","Fri"], "start": 540, "end": 590,
              "location": "Unity Hall 400" }
          ]
        },
        {
          "id": "AE 2320-CX01", "code": "CX01", "type": "lab",
          "status": "closed", "enrolled": 40, "capacity": 40,
          "waitlist": { "taken": 0, "capacity": 0 },
          "instructors": ["Ye Lu"],
          "delivery": "in-person",
          "meetings": [
            { "days": ["Thu"], "start": 840, "end": 890,
              "location": "Higgins Labs 230 Geom Modeling Computer Lab" }
          ]
        }
      ],
      "options": [
        ["AE 2320-CL01", "AE 2320-CX01"],
        ["AE 2320-CL01", "AE 2320-CX02"],
        ["AE 2320-CL01", "AE 2320-CX03"]
      ]
    }
  ]
}
```

(The example shows only two of the four sections.)

## Fields

### Term

| Field          | Example                        | Notes                                           |
| -------------- | ------------------------------ | ----------------------------------------------- |
| `id`           | `"2027-C"`                     | Also the file name.                             |
| `name`         | `"C Term"`                     |                                                 |
| `season`       | `"Spring"`                     |                                                 |
| `year`         | `2027`                         |                                                 |
| `start`, `end` | `"2027-01-13"`, `"2027-03-05"` | The dates most sections of the term share.      |

`generatedAt` is when WPI's file was fetched, for the last run that changed
this term. If nothing changed, it stays the same.

### Course

| Field         | Example                               | Notes                                                 |
| ------------- | ------------------------------------- | ----------------------------------------------------- |
| `code`        | `"AE 2320"`                           | Taken from the course title.                          |
| `subject`     | `"AE"`                                |                                                       |
| `title`       | `"Introduction to Orbital Mechanics"` |                                                       |
| `credits`     | `3`                                   | 3 is a normal 1/3-unit course. `null` if WPI has none. |
| `level`       | `"Undergraduate"`                     | Or `"Graduate"`.                                      |
| `description` | `"An introductory course..."`         | Plain text. `""` if WPI has none.                     |
| `sections`    |                                       | Sorted by `id`.                                       |
| `options`     |                                       | See [Options](#options).                              |

### Section

| Field         | Example                          | Notes                                                             |
| ------------- | -------------------------------- | ----------------------------------------------------------------- |
| `id`          | `"AE 2320-CL01"`                 | Unique within a term file.                                        |
| `code`        | `"CL01"`                         |                                                                   |
| `type`        | `"lecture"`                      | `lecture`, `lab`, `discussion`, `seminar`, `workshop` or `other`. |
| `status`      | `"open"`                         | `open`, `closed` or `waitlist`.                                   |
| `enrolled`    | `85`                             | Can be more than `capacity`.                                      |
| `capacity`    | `120`                            | 999 looks like WPI's "no limit" (varsity teams have it).          |
| `waitlist`    | `{ "taken": 0, "capacity": 20 }` |                                                                   |
| `instructors` | `["Ye Lu"]`                      | `[]` when nobody is assigned yet.                                 |
| `delivery`    | `"in-person"`                    | `in-person`, `hybrid`, `online`, `online-sync` or `online-async`. |
| `meetings`    |                                  | `[]` when there is no set time.                                   |

Four more fields show up on a section only when it differs from its course or
term. If the field isn't there, use the course's value (or the term's dates).

| Field         | Example                                          | When you'll see it                                       |
| ------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `title`       | `"INQ SEM: Early American History"`              | Topic courses like HU 3900, where every section is its own topic. |
| `description` |                                                  | The topic has its own description.                       |
| `credits`     | `0`                                              | The zero-credit sections of the music ensembles.         |
| `dates`       | `{ "start": "2026-08-20", "end": "2026-12-11" }` | Semester-long and late-start sections.                   |

### Meeting

| Field          | Example            | Notes                                                              |
| -------------- | ------------------ | ------------------------------------------------------------------ |
| `days`         | `["Mon", "Thu"]`   | `Mon` to `Sun`, in week order.                                     |
| `start`, `end` | `540`, `590`       | Minutes after midnight.                                            |
| `location`     | `"Unity Hall 400"` | Two rooms at once are joined: `"Little Theatre / Riley Commons"`.  |

A section has more than one meeting when its days have different times or
rooms.

## Options

`options` lists every valid way to take the course. Each option is a list of
section ids, and you take every section in exactly one of them. The engine
just picks one option per course, and the UI can still lock individual
sections because each section has its own id.

WPI ties a lecture to its labs with a cluster ID, but only sometimes. There
are three situations in the real data:

1. Everything is in a cluster. AE 2320 has one lecture and three labs in one
   cluster, so 1 × 3 = 3 options. Sections from different clusters never mix.
2. Nothing is in a cluster, but the course still has lectures and labs. CH 1010
   in A Term had 4 lectures and 21 labs with no cluster at all. Every lecture
   pairs with every lab: 84 options.
3. A mix. In MA 1021 each lecture is clustered with its own discussions, but
   the labs are in no cluster because every lecture shares them. Each
   lecture-discussion pair combines with every lab: 182 options.

So the rules are:

- Inside a cluster, take one section of each type.
- A lab or discussion with no cluster is an add-on. It joins every cluster that
  has none of that type, and every lecture that has no cluster.
- Any other section with no cluster is an option by itself (with the add-ons,
  if the course has any). That's the usual single-lecture course. It also
  covers FY 1101, where most sections stand alone and one is a lecture with
  labs.
- If a course is only labs (BB 2815), each lab is an option by itself.
- A semester-long section never pairs with a one-term one.

A section can end up in no option. Right now that's IMGD 2030-CX02 and
MA 2071-DD07: a lab and a discussion that WPI left out of their lecture's
cluster. They stay in `sections` so the UI can show them, but they can't be
scheduled. The script prints them on every run.

The big first-year courses have a lot of options. PH 1120 in B Term has 363,
which is 11 lecture-discussion pairs times 33 labs. That's correct, not a bug.

## index.json

The list of terms for the term picker, in date order:

```json
{
  "terms": [
    { "id": "2026-B", "name": "B Term", "season": "Fall", "year": 2026,
      "start": "2026-10-19", "end": "2026-12-11", "status": "upcoming",
      "courses": 588, "sections": 1145, "generatedAt": "2026-10-11T21:26:05Z" }
  ]
}
```

`status` is `"in-progress"` from the term's first day through its last, and
`"upcoming"` before that. The term picker can default to the first upcoming
term.

## Which terms are published

WPI publishes one file containing every term, so you can't fetch just some
terms. The filtering happens in `normalize.mjs`, after fetching. If a term file
appears or disappears, it's one of these rules:

- Finished terms are dropped. Any term whose end date is before today is
  skipped. A Term ended October 9, so `2026-A.json` disappeared.
- A term counts as current through its last day, so the end date is inclusive.
- Files for dropped terms are deleted from `apps/web/public/data/` and removed
  from `index.json`, so stale files don't stay in the folder. Only files named
  like a term (`2026-A.json`) are ever deleted.
- Next year's terms are held back until the current year's C Term has ended
  (the C/D break in early March). The C Term end date comes from the data, not
  a hard-coded date, so it adjusts every year. This also hides the stray
  `2027-B.json`: WPI has two sections filed under "2027 Fall B Term", and
  they stay hidden until March 6, 2027.
- Every date comparison uses New York time. GitHub's runners use UTC, which
  would make a term end a few hours early.

Two things that aren't obvious:

- "The current year" is the academic year of the earliest term that hasn't
  ended. An academic year starts with A Term in the fall, so `2026-B` and
  `2027-C` are the same year.
- If WPI has already taken C Term out of its file, it counts as ended once
  only D Term or later is left.

If every term in WPI's file has ended, the script stops with an error and
changes nothing. Better that than deleting every file.

To see what a run would do on another day:

```bash
TODAY=2027-03-06 node scripts/normalize.mjs data/raw/courselistings.json /tmp/goatplan
```

## Using the data

These belong to the UI and the engine, but they depend on what's in the JSON,
so they're written down here.

**Seats.** Show seats as "X of Y open". X is capacity minus enrolled, never
below 0 for over-enrolled sections. For an option (lecture + discussion + lab),
the open seats are the lowest among its sections. The lab is usually the
bottleneck. `enrolled` and `capacity` stay in the JSON as they are; this math
happens in the UI and the engine.

**Dates.** The data can be up to a day old, so the term picker should also hide
any term whose end date has passed. Same rules: New York time, end date
inclusive.

**Saved plans.** A saved plan for a term that has ended opens read-only with a
note that the term has ended, instead of failing. The term's file is gone by
then, so the plan needs its own copy of the sections it shows.

**Engine speed.** 363 options for one course is fine on its own, but it comes
from labs pairing freely with every lecture. A future improvement is to treat
"lecture + discussion" and "lab" as two separate choices in the engine instead
of listing every combination. That cuts PH 1120 from 363 choices to 11 + 33.
The current format works for now. Revisit this if the engine's timing test
runs slow.

## Decisions built into this format

- Times are minutes after midnight: 9:00 AM is 540, 9:50 AM is 590. That's
  easy to compare in C++ and easy to format in the UI.
- Days are short names (`"Mon"`, `"Thu"`). WPI's `R` becomes `"Thu"` here,
  once, so no other code has to know about it.
- A section with no set time gets `"meetings": []`. That's how the UI knows to
  put it in the "No set time" strip.
- Each course's description is stored once, not on every section. WPI repeats
  it on every row, which roughly doubles the file size.
- Everything is sorted (courses by code, sections by id), and each section and
  option sits on its own line in the file. So each day's git commit shows only
  what actually changed, and a day with no changes makes no commit at all.

A term file is about 900 KB, or 180 KB gzipped.

## Edge cases from the real data

- Semester-long sections. About one row in six belongs to "Fall Semester" or
  "Spring Semester" instead of a lettered term: MA 1020, PE, music ensembles,
  most graduate courses. They go into both term files they run through, with
  their own `dates`. So once A Term's file is gone, a fall-semester section is
  still in the B Term file. Late-start online sections are placed the same
  way, by their dates.
- Room changes mid-semester. A semester-long section can list the same time
  twice, with two date ranges and two rooms. Each term file keeps the room for
  its own half.
- Rows that aren't sections. "Interest List" rows (a sign-up list for a full
  course) and cancelled rows (`X cancel 3.30.26`) are left out.
- Section codes with extras. `"AD02 (group 2)"` becomes `AD02`. Suffixes that
  tell two sections apart are kept: `BX03-A`, `BS01-Multipurpose`.
- Over-enrolled sections: `"21/20"` and a waitlist that's been used. The real
  numbers are kept and the UI shows them as full.
- No instructor: an empty Instructors field, as in AE 4310 C01. That's `[]`,
  and the UI shows "Instructor not assigned yet."
- Online asynchronous sections have no meeting time at all, so `meetings: []`.
- Graduate courses (5000 level and up) are mixed in with undergraduate ones.
  They're kept with a `level` field, and the UI filters.
- Cross-listed subjects: `"Aerospace Engineering; Physics"`. The course code
  from the title is the source of truth.
- Rooms and times that don't line up. Three meeting patterns with two rooms
  can't be matched by position, so rooms are matched through WPI's
  `Section_Details` field.
- "Discussion" is what WPI's listing calls a conference. The type is
  `discussion`.

## Checking the output

Every run prints a summary: which terms were left out and why, the counts for
each published term, what was skipped, every value a parser couldn't read, and
every file it wrote or deleted. If WPI adds a format the parsers don't know,
you find it there on day one instead of from a bug report.

Before writing anything, the script checks that each term has its dates, that
`start < end` for every meeting, that there are no NaNs, that every option
points to real sections, and that no course ends up with zero options. If a
check fails, nothing is written or deleted.

The daily update then runs `scripts/check-section-drop.mjs`, which compares the
new `index.json` with the one in the last commit. If a term that hasn't ended
lost more than 10% of its sections, or disappeared, the update stops and
commits nothing. On a normal day only a handful of sections change, so a drop
like that almost always means WPI sent a partial file.

If the drop is real, say WPI cancelled a lot of sections at once, start the
"Update course data" workflow by hand from the Actions tab and tick
`allow_drop`. That run skips the check and commits the update. Scheduled runs
always check.

The parsers are in `scripts/lib/` and are tested with Node's built-in test
runner, using real strings from WPI's data:

```bash
npm run data:test
```

`data/fixtures/sample-sections.json` is a small real sample in WPI's format.
`data/fixtures/2027-C.small.json` is what the script makes of its C Term rows,
and a test keeps the two in sync.
