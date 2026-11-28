# Biochemistry — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-06/BC-2030_fillable.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “Effective for students entering AY 2026-2027”. The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines                                              | Requirement                                   | Units    |
| -------------------------------------------------- | --------------------------------------------- | -------- |
| 1, 2, 3, 4, 5, 6                                   | Humanities and Arts                           | 2        |
| 7                                                  | Wellness and Physical Education               | 0.333333 |
| 8, 9                                               | Social Science                                | 0.666667 |
| 10, 11, 12                                         | Interactive Qualifying Project                | 1        |
| 13, 14, 15                                         | Free Electives                                | 1        |
| 16, 17, 18, 19, 20, 21                             | Mathematics and Physics                       | 2.0      |
| 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34 | Chemistry and Biochemistry                    | 4.333333 |
| 35, 36, 37, 38                                     | Biology                                       | 1.333333 |
| 39, 40, 41                                         | Chemistry and Biochemistry/Biology Laboratory | 1.0      |
| 42                                                 | Other Natural or Computer Science             | 0.333333 |
| 43, 44, 45                                         | Major Qualifying Project                      | 1.0      |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- The PDF recommends MA 1021–1024 and PH 1110–1120 or equivalents. Confirm your preparation with your advisor.
- Confirm one unit organic, 4/3 units biochemistry, and 1/3 unit each physical and inorganic chemistry at 3000-level or above. Number prefixes alone do not confirm the topic.
- Confirm cell biology, genetics and at least one 3000-level or higher biology course.
- Confirm one unit of laboratories, at least 2/3 unit chemistry and biochemistry, including CH 4150 or CH 4170. CH 4170 and BB 3827 cannot both count.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/bc-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Mathematics and Physics: 2 completed, 0 planned.
- Chemistry and Biochemistry: 3 completed, 0 planned.
- Biology: 0 completed, 1 planned.

`data/fixtures/bc-2030-edge.json` checks a different boundary. CH 4170 can fill the named laboratory row, but the remaining lab credit cannot complete without confirmation. BB 3827 must not be confirmed alongside CH 4170. Inorganic chemistry is planned.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
