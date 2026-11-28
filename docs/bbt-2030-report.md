# Biology and Biotechnology — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-04/BBT-2030.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “Effective for students entering AY 2026-2027”. The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines                                  | Requirement                     | Units    |
| -------------------------------------- | ------------------------------- | -------- |
| 1, 2, 3, 4, 5, 6                       | Humanities and Arts             | 2        |
| 7                                      | Wellness and Physical Education | 0.333333 |
| 8, 9                                   | Social Science                  | 0.666667 |
| 10, 11, 12                             | Interactive Qualifying Project  | 1        |
| 13, 14, 15                             | Free Electives                  | 1        |
| 16, 17, 18, 19, 20                     | Quantitative Reasoning          | 1.666667 |
| 21, 22, 23, 24, 25                     | Chemistry                       | 1.666667 |
| 26, 27, 28, 29, 30, 31, 32, 33, 34, 35 | Biology and Biotechnology       | 3.333333 |
| 36, 37, 38, 39                         | Laboratory Experience           | 1.333333 |
| 40, 41, 42                             | Related Courses                 | 1.0      |
| 43, 44, 45                             | Major Qualifying Project        | 1.0      |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

The PDF writes BB 11xx, BB 2xxx and BB 3xxx/4xxx. Course-number patterns implement these ranges and exclude x8xx laboratory courses from lecture rows. BB 4900 occupies one row only. Related half-unit labs need credit review.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- Confirm at least one statistics course or a BCB, CS or DS course in Quantitative Reasoning.
- Confirm 4/3 units of laboratory experience, including the required levels. Each lab may count once. Confirm these lines only after completing the labs.
- Confirm at most one listed graduate course. Related half-unit laboratories and ISPs require manual credit review; the audit places only full courses automatically.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/bbt-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Chemistry: 2 completed, 0 planned.
- Quantitative Reasoning: 2 completed, 0 planned.
- Biology and Biotechnology: 1 completed, 1 planned.

`data/fixtures/bbt-2030-edge.json` checks a different boundary. The four introductory/laboratory courses cannot fill biology lecture lines. Repeating BB 4900 does not earn a second lecture slot. Labs require explicit credit allocation.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
