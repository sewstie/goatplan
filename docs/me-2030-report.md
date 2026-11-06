# ME Class of 2030

This sheet remains beta behind tester access. Student Workday verification and
public release belong to ticket 09.

## Sources

Reviewed November 5, 2026:

- [Official Class of 2030 sheet](https://www.wpi.edu/sites/default/files/2026-06/ME-2030_fillable.pdf).
- [Mechanical Engineering, 2026–27 catalog](https://wpi.cleancatalog.net/mechanical-and-materials-engineering/mechanical-engineering-major).
- [WPI tracking sheet directory](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets).

The first PDF page supplies the numbered requirements. The second is a program
chart; the third is a planning template. Concentrations are outside this sheet.

## Numbered requirements

| Lines | Matching treatment |
| --- | --- |
| 1–6 | Humanities depth, Inquiry at 4, breadth at 5, elective at 6. |
| 7 | Four WPE slots. Completion requires courses or explicit confirmation. |
| 8–9 | Social science, including ID 2050. |
| 10–12 | IQP confirmation items. |
| 13–15 | One nine-credit free elective pool. |
| 16–21 | MA 1021–1024, MA 2051, MA 2071. |
| 22–24 | Chemistry, physics, then either discipline. This allocation enforces both science options. |
| 25–26 | Additional MA, BB, CH, PH or GE. |
| 27–29 | ES 2501, ES 2502, ES 2503. |
| 30 | ME 4320, 4322, 4323 or 4324. RBE 4322 is cross-listed. |
| 31–33 | ES 3001, ES 3004, ES 3003. |
| 34 | ME 4422 or ME 4429. |
| 35 | ES 2001. |
| 36 | ECE courses except ECE 1799, including cross-listed equivalents. |
| 37 | ME 3901 or ME 3902. |
| 38 | Programming choices from the tracking sheet. |
| 39–41 | MQP confirmation items. |
| 42–45 | Engineering elective candidates with a separate eligibility check. |

## Interpretations

Engineering department matches are provisional. The visible distribution check
requires review of all four electives, their levels, and the two-course ME
2000/3000 or ES 3011/3323 condition. Prefixes alone cannot prove approval.
The candidate departments are AE, AREN, BME, CE, CHE, ECE, ES, ME and RBE.
Other approved choices require advisor review; no shared matcher special-cases ME.

Science thermodynamics is never assigned to both science and engineering.
CH 3510 or PH 2101 can match science. A separate line 31 confirmation records
the approved substitution only after the student records another engineering
elective. The thermodynamics credit check stays open independently of that
checkbox. Confirming a check cannot manufacture a missing course or approval.

The programming check calls out choices present in the PDF beyond the catalog's
examples. The science check calls out the broader GE filter versus the chart's
GE 2341 reference. Math equivalents and humanities sequence need confirmation.
Residency and capstone review also remain explicit.

All 45 numbered lines total 15 units including WPE. The PDF also states a
15-unit academic minimum. The app preserves the numbered lines and exposes an
academic-credit check for this ambiguity and the engineering total. Filling
every tile does not establish graduation eligibility. No WPE completion is
inferred from an academic history.

Cross-lists use the existing generic engine rules. Each course is counted once.
No CS exclusions or only-one sets are inherited.

## Worked histories and validation

`data/fixtures/me-2030-mid.json` contains 17 completed courses and two planned
courses. `data/fixtures/me-2030-complete.json` contains 38 academic courses, six
confirmed project equivalents and explicitly confirmed WPE. “Complete” means
the numbered lines are filled; interpretation and credit checks remain open.
Expected answers were worked from the numbered requirements. Interchangeable
slots assert completion without requiring an arbitrary course order.

Both fixtures run through EngineClient/WebAssembly and the native CLI using
the same expected answers:

```sh
GOATPLAN_NATIVE_CLI="$PWD/engine/build/goatplan_cli" npm run test -w web -- src/lib/degree/me-audit.integration.test.ts
npm run lint
npm run test
npm run build
PORT=3096 npm run test:e2e -w web -- degree-me.spec.ts degree-major.spec.ts --project=production --workers=2
```

TDD exposed missing science allocation, elective review and thermodynamics
review behavior before the sheet data was updated. All implementation uses
existing generic filters, manual items and checks. Engine source and committed
WASM files were not changed.

Validation passed: lint, production build and all 1,703 Vitest tests with native
fixtures enabled. Seven production browser checks pass, including search
badges, term actions, selection, tester access, keyboard confirmation and
persistence. The UI reviewer found no remaining blockers in refreshed 1440px
and 834px screenshots. The review used the established degree UI because
`docs/design` and its reference PNGs are absent in this checkout.
