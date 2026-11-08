# ECE Class of 2030

This sheet is beta and available only through tester access. Workday verification
and the public release gate remain in ticket 09.

## Sources

Reviewed November 5, 2026:

- [Official Class of 2030 tracking sheet](https://www.wpi.edu/sites/default/files/2026-07/ECE-2030_fillable.pdf).
- [Electrical and Computer Engineering, 2026–27 catalog](https://wpi.cleancatalog.net/electrical-and-computer-engineering/electrical-and-computer-engineering-major).
- [WPI tracking sheet directory](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets).

The first PDF page supplies the numbered requirements. Its second page is a
planning template. Concentrations are outside this sheet.

## Numbered requirements

| Lines | Treatment |
| --- | --- |
| 1–6 | Humanities depth, Inquiry at 4, breadth at 5 and elective at 6. |
| 7 | Four WPE slots. Courses or explicit sports confirmation are required. |
| 8–9 | Social science, including ID 2050. |
| 10–12 | IQP confirmations. |
| 13–15 | One nine-credit free elective pool. |
| 16–19 | MA 1021, MA 1022, MA 2051 and MA 2621. |
| 20–22 | Three more mathematics courses. |
| 23–24 | Two physics courses. |
| 25 | Chemistry or biology. |
| 26–27 | Additional mathematics or basic science. |
| 28–30 | MQP confirmations, with a separate capstone-content check. |
| 31 | Computational engineering, with the stated CS exclusions. |
| 32–34 | Three approved electrical engineering choices from the PDF. |
| 35 | Digital circuit design. |
| 36 | Embedded computing. |
| 37–43 | Additional ECE at 2000-level or above, or ES 3011. |
| 44–45 | Additional engineering science and design. |

The numbered lines total 15 units including WPE. Engineering contributes six
units including the MQP. The ECE portion contributes five units including the
MQP; computational engineering and the two additional engineering courses are
separate. A course counts once, even when entered under both cross-list names.

## Interpretations and unresolved checks

The electrical-engineering PDF list includes ECE 3501, ECE 4011 and ECE 4023.
The catalog's corresponding approved list omits them. The sheet preserves the
PDF choices, including BME cross-lists, and keeps their approval unresolved.

Engineering design depends on placement. ECE 2799 must count on lines 37–43,
or BME 3300, CS 3733, ES 3501, ME 2300 or ME 4320 must count on lines 44–45.
For example, CS 3733 on line 31 does not establish design credit. This is an
explicit confirmation, as on the PDF. Matching a course never confirms it.
MQP confirmations do not confirm capstone design content either.

The math lines preserve the PDF's named courses. Alternative calculus and
probability courses need advisor review. The humanities sequence and depth
level also need confirmation. Residency remains unresolved because course names
alone cannot establish where credit was earned.

Lines 44–45 enumerate the 252 eligible course codes in the catalog's additional
engineering tables. This expresses the level and department restrictions using
the existing generic course filter. Excluded CS courses and their aliases do
not match engineering. Unlisted, graduate, special-topic and approved substitute
courses need advisor review; the section note and credit check say so. This
enumeration must be reviewed when the catalog changes. ECE and computational
filters use the existing generic level filter.

Cross-lists come from the catalog's course rows. Existing shared humanities and
social-science cross-lists are retained. There are no additional sheet-wide
exclusions or only-one sets in these major requirements. CS exclusions apply
only to the specified engineering lines; excluded courses may still count as
mathematics, social science or free electives where eligible.

Filter priorities preserve specific requirements before broad electives.
Computational engineering precedes additional ECE; additional ECE precedes
additional engineering. The engine and committed WASM files are unchanged.
No new generic rule type is required.

## Worked histories and checks

`data/fixtures/ece-2030-mid.json` has 18 completed courses and two planned
courses. `data/fixtures/ece-2030-complete.json` has 38 academic courses and six
project confirmations, with WPE explicitly confirmed separately. Expected
answers were worked from the official numbered requirements. Interchangeable
slots assert section counts rather than an arbitrary assignment.

Complete means every numbered line is filled. It does not mean Workday has
verified the degree. Interpretation checks remain unresolved in both histories.
The same JSON answers run through EngineClient/WASM and the native CLI.
Additional audit checks cover duplicate cross-lists and engineering exclusions.

```sh
GOATPLAN_NATIVE_CLI="$PWD/engine/build/goatplan_cli" npm run test
npm run lint
npm run build
PORT=3098 npm run test:e2e -w web -- degree-ece.spec.ts degree-major.spec.ts --project=production --workers=2
```

The TDD cycles exposed missing registration, incorrect broad-elective
allocation, missing source-review checks, missing cross-lists and inherited
CS math guidance before the corresponding sheet data was added.

Validation passed: lint, all 1,713 tests with native fixtures enabled, the
production build, 163 native engine tests and seven production browser checks.
The browser checks cover selection, audit, search badges, term actions,
keyboard confirmation, persistence and tester access. The UI reviewer found
no blockers in the 1440px and 834px screenshots. `docs/design` and its reference
PNGs are absent in this checkout; review used the established degree UI.
