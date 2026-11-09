# My degree tracking sheet

My degree is a standalone sheet. The chosen major, course history, pins and
confirmations determine its audit. Changing a planner term or draft never changes
degree progress. My degree has no global Term picker and does not initialize the
schedule planner.

## History

Each course has a `status` of `taken` or `planned`. Only records explicitly added
to My degree as planned count toward planned progress. A term is optional. Stored
history accepts A, B, C, D and E terms from 2026 through 2030. The
four-year picker starts in A Term 2026 and ends in D Term 2030, with summer
choices for the first three years. A term does not need published course data. Undated planned records stay undated in charts and
history groups.

The storage key remains `goatplan:history:v1`. New exports use version 2. Version 1
histories and imports migrate `inProgress: true` to `status: "planned"`; all other
legacy records become taken. Unsupported legacy dates become no term. Course
codes, titles, credits, AP/IB flags, credit sources, pins and confirmations stay.
Version 2 imports validate statuses and the allowed term range.

Search and manual entry both offer Taken / Planned and an optional term. Manual
entry remains available for AP, IB, transfer and retired courses. Paste first
shows a review. The student chooses “These are: Taken / Planned” for selected
records and can apply “Term for selected.” Nothing is stored until Add is chosen.
Duplicates keep their existing record.

## Catalog

`data/catalog.json` stores course codes, titles, credits, level, `lastOffered`
(the latest term the course was seen in, like `2027-D`, or null if never seen)
and observed `termLetters`. It is served at `/data/catalog.json`. Degree search
loads this catalog without loading planner term files.

`data/wpi-catalog-2026-27.json` seeds courses from the official
[WPI 2026–27 undergraduate catalog](https://wpi.cleancatalog.net/classes).
Units are converted to the app’s credit scale: one WPI unit is nine credits.
Cross-listed codes receive separate searchable entries. Variable credit values
stay null; adding one uses the existing three-credit default, which can be edited.
ISU, ISU BB and HU—AAS-50 are catalog identifiers without numbered WPI course
codes. They remain searchable and can be kept in history for review. They do not
enter candidate audits or fill requirements. Add the numbered registration code
manually when known.

`npm run data:catalog` merges published terms into the saved catalog. The daily
job runs it after normalization and commits the catalog with the term updates.
Existing courses and observed term letters are never deleted, so a course that
stops being offered can still be found and added. If a later term file has a new
title or credit value for a course, that one wins. Search works out the label
from today’s date: a course never seen shows “Not offered in 2026–27” (the
current academic year), and a course last seen in an earlier year shows “Last
offered in D Term 2027”.

## AP and IB credit

`apps/web/src/lib/degree/exam-credit.json` lists every exam in WPI’s
[AP credit table](https://www.wpi.edu/offices/registrar/policies-procedures/ap-credit)
and [IB credit table](https://www.wpi.edu/offices/registrar/policies-procedures/ib-credit),
copied on 2026-11-06. Check those pages and update the file by hand when WPI
changes them. WPI’s IB table says BU 1000 for Business Management, but WPI’s
business subject is BUS, so the file uses BUS 1000. AP credit needs a 4 or 5. IB credit needs an HL score of 6 or 7.
A few courses need more, like MA 1022 for AP Calculus AB (5) or CH 1020 for IB
Chemistry (7).

Picking an exam and a score adds the courses WPI gives for it as taken AP/IB
transfer credit with no term. That is the only way a course gets the AP/IB
mark. The manual course form and the course details no longer have an AP/IB
switch. Older histories keep their marks. WPI counts at most 1 AP/IB course
toward humanities, and the audit applies that: one AP/IB course can fill a
humanities line, and any others count somewhere else, with a note saying so. Elective codes like CS 1000 or BUS 1000 fill
whatever line they fit, and the student can pin them to another line. A course
already in the history, or given by another exam, is skipped and reported, so
it never counts twice. See repeated elective codes below.

## Humanities path

Humanities and Arts work the same for every major, so the subjects and
groupings live once in `apps/web/src/lib/degree/humanities.ts`. A test fails if
a sheet’s copy drifts from them. The rules come from WPI’s
[HUA tracking sheet](https://www.wpi.edu/sites/default/files/2026-08/HUA-2030_fillable.pdf)
and the [humanities guide](https://web.wpi.edu/Images/CMS/HUA/HumanitiesFAQ_FINAL.pdf).
There are two paths:

- Depth and breadth: 3 related courses in one grouping, one of them at the
  2000 level or above, then HU 3900 or HU 3910. Add a course from another
  grouping and one humanities elective.
- Language: all six courses in one language. The last one takes the place
  of the seminar, and no breadth course is needed. WPI teaches Arabic (AB),
  Chinese (CN), German (GN), Spanish (SP) and English for non-native speakers
  (ISE), see [language programs](https://www.wpi.edu/academics/departments/humanities-arts/language-programs).
  The last course is 3000 or above, except in Arabic: WPI’s Arabic path is
  three elementary and three intermediate courses, so it ends at 2000 or above.

Students with three years of a language in high school (B or better, no AP
exam) can ask WPI for 1/3 unit of credit in it. It counts as one of the six, so
five intermediate or higher courses at WPI finish the language path
([request form](https://www.wpi.edu/sites/default/files/2023-02/LanguageStudyHighSchoolRequstforCredit.pdf)).
It is entered like AP credit, so the one-AP limit applies.

On the language path, the humanities section note on the sheet explains it
(`huaPathNote`). On depth and breadth the sheet’s usual note stays.

The first humanities course picks the path. A Spanish course starts the Spanish
path, and a history course starts depth and breadth. Courses are ordered by
term. Taken courses with no term (like AP credit) come first, and planned ones
with no term come last. A later course outside that language, or an HU 3900 or
HU 3910, moves the student to depth and breadth. ISE works the same way: all
ISE courses start the ISE path, and a course in another subject moves the
student to depth and breadth. A path the
student picks always wins. It is saved as `huaPath` (`"depth-breadth"` or
`"language:SP"`) at the top of the history, so it stays the same across majors.

On the language path, the six humanities lines take only that language, the
seminar line takes a 3000+ course in it, and the depth and breadth checks and
the depth confirmation are left out. The engine audits that changed sheet as it
is, so it needs no special rule for languages.

## Filling an empty field

Clicking an empty field opens courses that meet that requirement across all
terms. General fields use the sheet's subject, level or exact-course filter.
Named CS area fields use the approved area lists, so Social Implications shows
CS 3043, GOV/ID 2314, GOV 2315, IMGD 2000 and RBE 3100 rather than arbitrary CS
courses. IMGD 2002 is not in the Class of 2030 sheet's approved list.

The term and status controls determine how a selected course is added. They do
not restrict the list to that term's published schedule. The right side of each
row shows observed catalog letters, such as “Usually A, C,” or “Terms unknown.”
These are historical offerings, not confirmed future sections or seat counts.

Courses already in history, graduate courses and humanities courses that cannot
count are omitted. Cross-listed courses appear once under a qualifying code,
with observed terms combined across aliases. Search can match any alias or title.
The From your history section also respects the chosen CS area.

A qualifying CS area choice can be pinned to the clicked area line. A non-CS
Social Implications choice is added without a CS-line pin: it supports the
social check while counting toward another eligible field or free electives.
The panel repeats the sheet's warning that these courses do not count toward CS
units. General fields pin a course when another kind of empty field could take
it. AP, IB, transfer and retired courses remain available through Add courses.

## Great Problems Seminar

A GPS (FY 1100 and FY 1101) is posted as two credits that depend on the section.
`apps/web/src/lib/degree/gps-sections.json` lists the
[current sections](https://www.wpi.edu/academics/undergraduate/great-problems-seminar),
copied on 2026-11-06. Three of them give a humanities credit: Climate Present,
Climate Futures and Biodiversity give INTL 1000, and Recover, Reuse, Recycle
gives HU 1100. Picking a section adds its two credits. FY 1100 or FY 1101 already
in the history is reported, so it can be swapped for the credits.

## Repeated elective codes

The history keeps one record per code, and the audit counts a repeated code
once. When one exam gives the same code twice, like MA 1000 from IB
Mathematics, the record keeps both: `copies: 2` and the credits of both
(6). The audit request splits the credits per copy, and each copy fills its
own line. Pinning moves one copy and leaves the other where it was.

Two different sources that give the same code still count once: AP Biology
plus the Heal the World GPS both give BB 1000, and the second shows up as
skipped.

## Plan ahead

The four-year grid starts in A Term 2026. Moving a course changes its saved term;
it does not modify a planner draft. Taken, In progress and Planned are display
states derived from the record's stored status and the current term. Stored
statuses remain `taken` or `planned`.

IQP and MQP reservations are saved separately under `goatplan:degree:projects`.
They reserve terms for recommendations but do not confirm project requirements.
These reservations are separate from the exported history backup.
Undated courses remain in the unplaced tray. CS alone exposes Suggest next terms
for one to four future regular terms. See [recommendations](course-recommendations.md).

## Explicit planner connections

Tablet and desktop show Add to degree beside the planner's other actions. Its
panel lists the displayed plan's courses and asks for an explicit Add action.
On a phone, Add to My degree is a row in More actions and adds directly. Both
paths use `useAddPlanToDegree`, add planned records for the displayed plan's term,
and preserve existing records. Empty or unsupported-term plans disable the
action. It is hidden in shared/temporary previews. Results report newly added
courses, duplicates, invalid input or
visit-only storage; successful results link to My degree. Changing the plan later
does not synchronize the copied records.

A planned history record with published data can explicitly open its term in the
planner. Catalog search, course history, and opening My degree never do this by
themselves.

## Individual suggestions

The separate Suggestions tab and Suggest courses for this line action are
currently disabled by `SUGGESTIONS_ON = false` in `degreeFeatures.ts`. This does
not disable field course lists, search badges, course maps or CS next-term
recommendations.

The retained `SuggestCoursesPanel` implementation has its own term choice and
uses candidate audits against the selected sheet and history. When enabled, it
excludes completed/planned duplicates and free-elective-only matches. Published
term candidates need open registration options and a verified schedule with that
term's dated plans. Unchecked or clashing candidates stay hidden and failed
checks can be retried. It refreshes live seats with daily-data fallback.
Unpublished terms use observed offering letters. Plan for a term adds history;
Open in planner is a separate action for a published course.
