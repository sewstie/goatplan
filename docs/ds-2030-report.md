# DS Class of 2030

This is a requirement-source and interpretation record. The current registry
makes this sheet selectable at `/degree`, with beta status and no recorded
student Workday verification. Validation counts and implementation sequences
below describe the original feature snapshot, not the current test suite. See
[major selection](degree-major-selection.md) and [current project checks](launch-check.md)
for current access and verification behavior.


## Sources

Reviewed November 5, 2026:

- [Official Class of 2030 tracking sheet](https://www.wpi.edu/sites/default/files/2026-06/DS-2030_fillable.pdf).
- [Data Science, 2026–27 catalog](https://wpi.cleancatalog.net/data-science/data-science-major).
- [WPI tracking sheet directory](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets).

The PDF has numbered requirements on page one, elective tables on page two,
and a planning template on page three.

## Numbered requirements

| Lines | Treatment |
| --- | --- |
| 1–6 | Humanities depth, Inquiry at 4, breadth at 5 and elective at 6. |
| 7 | Four WPE slots. Courses or explicit sports confirmation are required. |
| 8–9 | Social science, including ID 2050. |
| 10–12 | IQP confirmations. |
| 13–15 | One nine-credit free elective pool. |
| 16–18 | DS 1010, DS 2010 and DS 3010. |
| 19–21 | Algorithms plus two CS foundation courses, with at most one introductory 1000-level course. |
| 22–26 | Statistics I and II, linear algebra, and two calculus or approved mathematics electives. |
| 27–28 | Business analysis and entrepreneurship/innovation alternatives. |
| 29–39 | Eleven disciplinary electives with four at 4000-level or above and three required category checks. |
| 40 | One approved data privacy and ethics course. |
| 41–42 | Natural or engineering sciences from the catalog departments. |
| 43–45 | MQP confirmations and a separate DS faculty-advisor check. |

The PDF leaves the elective rows interchangeable. The audit reserves rows 29–32
for the four advanced electives and uses rows 33–39 for other approved electives.
The category checks count courses actually placed in the elective section.
A foundation course cannot also satisfy an elective category.

## Interpretations and unresolved checks

The PDF lists CS 4343, CS 4344, CS 4345, CS 4802 and CS 4803, including their
DS and BCB aliases, which the catalog elective table omits. These remain eligible
with an explicit source-review check. DS 4342 is named on the PDF as an alias of
CS 4342. Other aliases follow the catalog course rows. Cross-listed courses count
once even when both names appear in the history. DS 4099 is an approved elective.
Unlisted and graduate substitutions need advisor review.

The PDF permits CS electives as foundation substitutions. The catalog specifies
3000-level or above, so the automatic foundation choices use that restriction
alongside the named introductory and object-oriented courses. A manual check
records this source difference. The mathematics foundation accepts the named
calculus alternatives and listed MA electives, including cross-lists.

MA 1020/1021 and MA 1022/1120 are mutually exclusive for foundation placement.
The shared engine can still place the redundant course into free electives.
The credit-review check explicitly requires replacing it before confirming credit.
This limitation remains visible in the UI; a filled sheet is not verified credit.

The catalog permits ethics to overlap social science with an extra free elective.
This audit counts each course once and gives ethics priority over social science
and humanities. The overlap route needs advisor review and is described in the
ethics section and credit confirmation. It is not automatically marked complete.
The total-credit check also requires confirmation of 135 academic credits and
15 units. These interpretations require an actual Workday comparison before recording
student verification.

Humanities level and sequence, MQP advisor affiliation and residency cannot be
established from course codes. They remain explicit checks. WPE never completes
without courses or a separate sports confirmation.

All matching uses existing generic filters, priorities, cross-lists, only-one sets,
area checks and manual checks. The engine and committed WASM files are unchanged.

## Worked histories and checks

`data/fixtures/ds-2030-mid.json` has 18 completed courses and three planned courses.
It leaves WPE, projects, ethics, business modeling and most electives unfinished.
Machine learning is planned, rather than completed.

`data/fixtures/ds-2030-complete.json` has 38 academic courses, six project
confirmations and an explicit sports confirmation. Its four advanced electives
are CS 4445, MIS 4084, MA 4635 and CS 4433. Distinct courses satisfy foundation,
elective categories, ethics, social science and free electives. All 45 numbered
lines are filled; residency and interpretation checks remain unresolved.

Expected answers were worked from the official numbered requirements, not copied
from engine output. Both JSON histories run through EngineClient/WASM and the
native CLI. Additional audit checks cover cross-list duplicates, foundation
limits and an elective category left unmet when its course fills foundation.

```sh
GOATPLAN_NATIVE_CLI="$PWD/engine/build/goatplan_cli" npm run test
npm run lint
npm run build
PORT=3097 npm run test:e2e -w web -- degree-ds.spec.ts degree-major.spec.ts --project=production --workers=2
```

Production browser checks cover selection, audit, search badges, term actions,
keyboard confirmation, persistence and sheet availability at 1440px and 834px.
Design PNGs are absent in this checkout, so visual review uses the established
degree UI.

Original implementation validation passed: lint, all 1,722 tests with native fixtures enabled, the
production build, 163 native engine tests and seven production browser checks.
The TDD cycles exposed missing registration, unrestricted foundation choices,
missing cross-lists, absent elective category checks and missing worked histories
before their corresponding sheet data was added.

The UI reviewer inspected the 1440px and 834px sheets and the 834px confirmation
panel and found no blocking issues.
