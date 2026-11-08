# CS next-term recommendations

The action in the four-year plan is available only for `cs-2030`. It leaves the
individual-course suggestion flow intact. Previewing never initializes the
schedule planner or writes degree history. Applying adds planned records through
the degree source. Changes to inputs require regeneration. Storage failures keep
additions for the visit and say that they have not been saved.

The planner receives history, an effective tracking sheet, catalog, terms,
offerings, project reservations, exclusions, kept choices, and skill confirmations.
React, the clock, loading, storage, and EngineClient live outside selection.
The audit adapter caches requests within each generation and applies existing pins.
The selected sheet includes the existing humanities path. AP/IB awards, transfer
records, manual confirmations, cross-lists, and only-one groups stay in their
existing data and audit paths. Future and undated plans reserve degree allocations;
only completed courses and earlier dated plans establish prior preparation.

Selection is deterministic. Candidates must fit the credit cap, have supported
background, known positive credits, and confirmed or historically observed offerings.
Project terms receive no automatic additions. Existing overloads remain visible.
Candidates are ranked by completed background, published offerings, specific audit
value, useful preparation chains, and fewer observed offering opportunities inside
the requested terms. A stable course-code comparison breaks ties.
A bounded lookahead bonus favors preparation that makes a remaining useful course
ready in a later requested term. The combined selection is audited again before
acceptance, so isolated candidate gains cannot be counted twice. Free-elective-only
courses come after useful specific coursework and require remaining elective credit.

At each selection step the planner tests at most six ranked eligible candidates.
It adds at most six courses per term and evaluates at most 180 combined selections
per generation, across at most four consecutive regular terms. Background traversal
visits at most 96 references per target and stops cycles. Alternatives show at most
30 courses, with subject diversity before additional courses from the same subject.
These limits return useful partial plans. The result is not globally optimal.

The preparation evaluator uses the original nested expressions in
`lib/courseMap/cs-background.json`, not display arrows. Each record keeps its official
source and wording. Only aliases from those records identify equivalent knowledge;
credit-only alternatives do not establish equivalent preparation. Notes require
separate experience confirmations, which never award course credit. A curated null
background means no recommended background. Missing curation stays unknown and
requires explicit review before keeping a course. Most non-CS catalog courses have
no curated background here; they remain useful degree alternatives for review.

Published presence requires actual sections in a successfully loaded term file.
Published absence, request failure, historical observation, and unknown offerings
remain distinct. Failed requests can be retried by regenerating. Historical letters
are estimates, never annual-frequency claims. Seat information does not establish
registration eligibility or a conflict-free schedule.

When the planner looks for courses that lead to useful ones, it skips any "or"
choice the student already covers. Having CS 1101 means CS 1004 and CS 1005 never
count as preparation, so they aren't suggested to CS majors.

## Humanities

Every HUA line on the sheet takes any humanities course, and depth and breadth are only checked afterwards. So the audit alone would say a fifth literature course "fills" the last HUA line even though breadth then can't be met. `huaProblem` in `lib/degree/humanities.ts` closes that gap: with the courses already in history, it checks whether depth (3 from one area) and breadth (1 from another, not needed when depth is in languages) can still both be finished in the five lines. A course that would make that impossible:

- isn't suggested or listed under other options, and a kept one is dropped with the reason,
- loses its "counts toward" badge in course search and line suggestions,
- can't be added as planned from Add courses. A taken course is still recorded, with a note that it won't count.

It does nothing on the language path, when the five lines are already full, or when depth and breadth were already out of reach. The Inquiry Seminar (HU 3900/3910) isn't suggested for a term until five humanities courses come before it.

## Panel

The panel sits in the degree drawer. A gray settings card holds the starting term
(the degree term picker), the number of terms (1–4) and courses per term (2–4).
Courses per term become the credit limit at 3 credits each. A summer start moves to
the next regular term.

Each term is a card with a load bar. Courses already in that term show as small
chips. Suggestions are short rows: a tick box, code, title, units, one reason and
tags for background and offering. Skip and Details sit under each row, and Details
holds the full background, offering text and catalog wording. Skipping unticks a
course without making the list out of date. Other options stay folded, list offered
courses first and show five before "Show more"; Keep lives there and makes the list
out of date until you suggest again. Courses without tracked WPI background (most
courses outside CS) and special topics are never picked automatically, and lower
course numbers rank higher. After courses are added the list clears. Kept courses, skipped courses and confirmed experience show as
removable chips. The fine print lives in "How this works". The footer always shows
how many courses are ticked and the button that adds them.

The original design references under `docs/design/` are absent in this checkout.
Browser tests capture desktop, tablet, and phone in both themes.
