# Course data format

`scripts/normalize.mjs` is the translator between WPI's data and the app. WPI's
file is built for WPI's website: one flat row per section, times as text like
`"M-T-R-F | 9:00 AM - 9:50 AM"`, seats as `"85/120"`, HTML in descriptions, and
labs tied to lectures only through a cluster ID. The engine and the UI get
something cleaner: courses that contain their sections, times as numbers, and
the valid lecture-plus-lab combinations already worked out.

```
data/raw/courselistings.json   →   normalize.mjs   →   apps/web/public/data/
(WPI's format, one row                               ├── index.json     (list of terms)
 per section, every term)                            ├── 2026-B.json
                                                     ├── 2027-C.json
                                                     └── 2027-D.json
```

It runs after `fetch-courses.mjs` in the daily workflow (`npm run data:update`
does both). Everything is parsed once here, so the browser and the C++ engine
never deal with WPI's text formats.

Only current and upcoming terms get a file. A term that has ended loses its
file, see [Which terms are published](#which-terms-are-published).

## A term file

One file per lettered term, named `<term id>.json`. This is AE 2320 in C Term:
one lecture and three labs come out as one course with four sections and three
options.

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

(The example shows two of the four sections. In the real file each section and
each option sits on one line, see [Layout on disk](#layout-on-disk).)

### `term`

| Field           | Example                        | Notes                                                     |
| --------------- | ------------------------------ | --------------------------------------------------------- |
| `id`            | `"2027-C"`                     | Year and term letter, as WPI names them. Also the file name. |
| `name`          | `"C Term"`                     |                                                           |
| `season`        | `"Spring"`                     |                                                           |
| `year`          | `2027`                         |                                                           |
| `start`, `end`  | `"2027-01-13"`, `"2027-03-05"` | The dates most sections of the term share.                |

`generatedAt` is the time the WPI file was fetched, for the last run that
changed this term. A run that changes nothing keeps the old value.

### Course

| Field         | Example                               | Notes                                                              |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `code`        | `"AE 2320"`                           | From the course title, which stays the source of truth for cross-listed courses. |
| `subject`     | `"AE"`                                | The letters of the code.                                           |
| `title`       | `"Introduction to Orbital Mechanics"` |                                                                    |
| `credits`     | `3`                                   | A number. `3` is a normal 1/3-unit course. `null` if WPI gives none. |
| `level`       | `"Undergraduate"`                     | Or `"Graduate"`. Both are kept in the same file, the UI filters.   |
| `description` | `"An introductory course..."`         | Plain text, stored once per course. `""` if WPI has none.          |
| `sections`    |                                       | Sorted by `id`.                                                    |
| `options`     |                                       | See [Options](#options).                                           |

### Section

| Field         | Example                          | Notes                                                         |
| ------------- | -------------------------------- | ------------------------------------------------------------- |
| `id`          | `"AE 2320-CL01"`                 | Course code + section code. Unique within a term file.        |
| `code`        | `"CL01"`                         |                                                               |
| `type`        | `"lecture"`                      | `lecture`, `lab`, `discussion`, `seminar`, `workshop` or `other`. |
| `status`      | `"open"`                         | `open`, `closed` or `waitlist`.                               |
| `enrolled`    | `85`                             | Can be above `capacity`: `"21/20"` stays 21 and 20.           |
| `capacity`    | `120`                            | 999 seems to be WPI's way of saying "no limit" (varsity teams). |
| `waitlist`    | `{ "taken": 0, "capacity": 20 }` |                                                               |
| `instructors` | `["Ye Lu"]`                      | `[]` when nobody is assigned yet.                             |
| `delivery`    | `"in-person"`                    | `in-person`, `hybrid`, `online`, `online-sync` or `online-async`. |
| `meetings`    |                                  | `[]` when the section has no set time.                        |

A section also carries one of these **only when it differs** from its course or
term. When the field is missing, use the course's (or the term's) value:

| Field         | Example                                                | When it appears                                                    |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| `title`       | `"INQ SEM: Early American History"`                    | Topic courses, where each section of HU 3900 or FY 1101 is its own topic. |
| `description` |                                                        | The section's topic has its own description.                       |
| `credits`     | `0`                                                    | For example the zero-credit sections of the MU ensembles.          |
| `dates`       | `{ "start": "2026-08-20", "end": "2026-12-11" }`       | The section doesn't run for exactly the term: a full semester, a late start. |

### Meeting

| Field          | Example            | Notes                                                              |
| -------------- | ------------------ | ------------------------------------------------------------------ |
| `days`         | `["Mon", "Thu"]`   | `Mon` `Tue` `Wed` `Thu` `Fri` `Sat` `Sun`, in week order.          |
| `start`, `end` | `540`, `590`       | Minutes after midnight. The end is exclusive, as in the engine.    |
| `location`     | `"Unity Hall 400"` | Two rooms at the same time are joined: `"Little Theatre / Riley Commons"`. |

A section has several meetings when its days have different times or rooms.
They are sorted in week order.

### Options

`options` lists every valid way to take the course. Each option is an array of
section ids, and taking the course means taking **every section of exactly one
option**. The engine picks one option per course; the UI can still lock single
sections because every section has its own id.

WPI ties a lecture to its labs with a cluster ID, but only sometimes. The real
data has three situations, and `buildOptions` handles all of them:

1. **Everything is in a cluster.** AE 2320 has lecture CL01 and labs CX01 to
   CX03 in one cluster: 1 × 3 = 3 options. Sections from different clusters
   are never mixed.
2. **Nothing is in a cluster**, but the course still has lectures and labs.
   CH 1010 in A Term has 4 lectures and 21 labs with no cluster: every lecture
   pairs with every lab, 84 options.
3. **A mix.** In MA 1021 each lecture is clustered with its own discussions,
   and the labs belong to no cluster because every lecture shares them. Each
   lecture-discussion pair combines with every lab: 182 options.

The rules behind that:

- Inside a cluster, take one section of each type.
- A lab or discussion without a cluster is an add-on: it joins every cluster
  that has none of that type, and every lecture that has no cluster.
- Any other section without a cluster is an option by itself (plus one of each
  add-on, if the course has any). That covers the usual single-lecture course,
  and courses like FY 1101 where some sections stand alone and one is a
  lecture with labs.
- In a course that has only labs (BB 2815), each lab is an option by itself.
- A semester-long section is never paired with a one-term one.

A section can end up in **no option**. Today that is IMGD 2030-CX02 and
MA 2071-DD07: a lab and a discussion that WPI lists outside the cluster their
lecture is in. They stay in `sections` so the UI can show them, but nothing can
schedule them. The script prints these every run.

The big first-year courses have many options (PH 1120 in B Term has 363). That
is 11 lecture-discussion pairs times 33 labs, not a mistake.

## index.json

The list of published terms for the term picker, in date order:

```json
{
  "terms": [
    { "id": "2026-B", "name": "B Term", "season": "Fall", "year": 2026,
      "start": "2026-10-19", "end": "2026-12-11", "status": "upcoming",
      "courses": 588, "sections": 1145, "generatedAt": "2026-10-11T21:26:05Z" }
  ]
}
```

`status` is `"in-progress"` from the term's first day through its last day, and
`"upcoming"` before that. A term that has ended is not in the list at all. The
term picker can default to the first upcoming term.

## Which terms are published

WPI publishes one file with every term in it, finished ones and far-off ones
included, so there is no way to fetch only some terms. The filtering happens
in `normalize.mjs`, after fetching. These rules are why a term file appears or
disappears:

- **A finished term is dropped.** Once a term's `end` date has passed, it gets
  no file and no entry in `index.json`. A Term ended October 9, 2026, so
  `2026-A.json` disappeared after that.
- **The end date is inclusive.** A term is still current on its last day and
  is dropped the day after.
- **Old files are deleted.** The script removes the file of every term it no
  longer publishes from `apps/web/public/data/`, so nothing stale stays in the
  folder. It only touches files named like a term (`2026-A.json`).
- **Next year's terms are held back** until this academic year's C Term has
  ended, which is the C/D break in early March, when planning for next year
  starts. The date is the C Term `end` from the data, not a fixed date, so it
  moves with WPI's calendar every year. This also hides strays: WPI currently
  has two sections filed under "2027 Fall B Term", and `2027-B.json` stays
  hidden until March 6, 2027.
- **Every date is a New York date.** GitHub's runners use UTC, where the
  evening of a New York day already counts as tomorrow. Comparing in UTC would
  end a term a few hours early.

Two details of the hold-back rule:

- "This academic year" is the year of the earliest term that hasn't ended. An
  academic year runs from A Term in the fall through the following spring and
  summer, so `2026-B` and `2027-C` are the same year.
- If WPI has already removed C Term from its file, it counts as ended as soon
  as only D Term or later is left in this year.

If every term in WPI's file has ended, the script stops with an error and
changes nothing, instead of deleting every file.

To see what a run will do on another day:

```bash
TODAY=2027-03-06 node scripts/normalize.mjs data/raw/courselistings.json /tmp/goatplan
```

## Using the data

Rules for the UI and the engine that the data format relies on. The JSON keeps
WPI's raw numbers and dates; these are applied when the data is read.

**Open seats.** Show seats as "X of Y open". X is `capacity - enrolled`, and
never below 0 for an over-enrolled section. For an option (lecture +
discussion + lab), the open seats are the lowest among its sections; the lab
is usually the bottleneck. `enrolled` and `capacity` stay in the JSON as WPI
gives them, and this math is done in the UI and the engine.

**Check the dates again in the UI.** The data can be up to a day old, so the
term picker also hides any term whose `end` date has passed, using the same
rules as above: New York date, end date inclusive.

**Saved plans for a term that has ended** open read-only, with a note that the
term has ended, instead of failing. The term's file no longer exists by then,
so a saved plan has to keep its own copy of the sections it shows.

**Engine performance.** 363 options for one course is fine on its own, but the
count comes from labs pairing freely with every lecture. A future improvement
is to treat "lecture + discussion" and "lab" as two separate choices in the
engine instead of listing every combination, which cuts PH 1120 from 363
choices to 11 + 33. The current format works for now. Revisit this if the
engine's timing test runs slow.

## Decisions built into this format

- **Times are minutes after midnight.** 9:00 AM is 540, 9:50 AM is 590. Easy
  to compare in C++ and easy to format in the UI.
- **Days are short names.** WPI's `R` becomes `"Thu"` here, once, so no other
  code has to know about it.
- **`options` is worked out here**, so the engine never sees a cluster ID.
- **No set time means `"meetings": []`.** That is how the UI knows to put a
  section in the "No set time" strip.
- **Shared values are stored once.** WPI repeats the description on every row,
  which roughly doubles the file size.
- **Everything is sorted**: courses by code, sections by id, options by their
  ids, meetings by day. The same input always gives the same file.
- **A quiet day makes no diff.** A term file is only rewritten when its data
  changed, and `generatedAt` only moves then.

### Layout on disk

The files are normal JSON, written with one section and one option per line:

```
      "sections": [
        {"id":"AE 2320-CL01","code":"CL01","type":"lecture","status":"open","enrolled":85,...},
        {"id":"AE 2320-CX01","code":"CX01","type":"lab","status":"closed","enrolled":40,...}
      ],
```

When one seat is taken, the daily commit shows that one line. A term file is
about 900 KB, or 180 KB gzipped.

## What the real data does

Things found in WPI's file (October 2026) and how the format deals with them.

**Semester-long sections.** About one row in six belongs to "2026 Fall
Semester" or "2027 Spring Semester" instead of a lettered term: MA 1020, PE,
music ensembles and most graduate courses. They are put into **both** term
files they run through, so each term file holds everything that meets during
that term. Each of them has `dates`. The few "Late Start Online" graduate
sections are placed the same way, by their dates. Once A Term's file is gone,
a fall-semester section is still in the B Term file.

**Room changes mid-semester.** A semester-long section can list the same time
twice with two date ranges and two rooms. Each term file keeps the room for
its own half.

**Rows that are not sections.** "Interest List" rows (a sign-up list for a
full course) and cancelled rows (`X cancel 3.30.26`) are left out. The script
prints how many it skipped.

**Section codes with extras.** `"AD02 (group 2)"` becomes `AD02`, since the
cluster already says which group it is. Suffixes that tell two sections apart
are kept: `BX03-A`, `BS01-Multipurpose`.

**Over-enrolled sections.** `"21/20"` and a used waitlist keep their real
numbers. The UI shows them as full.

**No instructor.** `"instructors": []`, and the UI shows "Instructor not
assigned yet."

**Online sections.** `delivery` says how they meet. An asynchronous one has no
meeting time, so `"meetings": []`.

**Rooms and patterns that don't line up.** Three meeting patterns with two
rooms can't be matched by position, so rooms are matched through WPI's
`Section_Details` field, which lists each room with its own pattern.

**"Discussion" is WPI's conference.** The catalog says conference, the listing
says Discussion. The format uses `discussion`.

**A stray term.** The file currently has two sections filed under "2027 Fall B
Term". That is next year's term, so it is held back, see
[Which terms are published](#which-terms-are-published).

## Checking the output

Every run prints a summary: which terms were left out and why, sections,
courses and options per published term, what was skipped or moved, every value
a parser couldn't read, sections that are in no option, and every file it
wrote or deleted. If WPI adds a format the parsers don't know, it shows up
there on day one.

Before writing, `validateTerm` checks that the term has its dates, that every
meeting has `start < end`, that no number is NaN, that every option points to
real sections, and that no course has zero options. If any check fails,
nothing is written or deleted and the script exits with an error, so a broken
file is never committed.

The parsers live in `scripts/lib/` and are tested with Node's built-in runner
against real strings from WPI's data:

```bash
npm run data:test
```

`data/fixtures/sample-sections.json` is a small real sample in WPI's format, and
`data/fixtures/2027-C.small.json` is what the script makes of its C Term rows.
A test keeps the two in sync.
