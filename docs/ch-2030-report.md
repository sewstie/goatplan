# Chemistry — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-06/CH-2030_fillable.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “Effective for students entering AY 2026-2027”. The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines                          | Requirement                            | Units    |
| ------------------------------ | -------------------------------------- | -------- |
| 1, 2, 3, 4, 5, 6               | Humanities and Arts                    | 2        |
| 7                              | Wellness and Physical Education        | 0.333333 |
| 8, 9                           | Social Science                         | 0.666667 |
| 10, 11, 12                     | Interactive Qualifying Project         | 1        |
| 13, 14, 15                     | Free Electives                         | 1        |
| 16, 17, 18, 19, 20, 21, 22     | Mathematics and Physics                | 2.333333 |
| 23, 24, 25                     | Experimental Chemistry                 | 1.0      |
| 26                             | Inorganic Chemistry                    | 0.333333 |
| 27, 28, 29                     | Organic Chemistry                      | 1.0      |
| 30, 31, 32                     | Physical Chemistry                     | 1.0      |
| 33                             | Biochemistry                           | 0.333333 |
| 34                             | Experimental Chemistry or Biochemistry | 0.333333 |
| 35, 36, 37, 38, 39, 40, 41, 42 | Additional Science/Engineering         | 2.666667 |
| 43, 44, 45                     | Major Qualifying Project               | 1.0      |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- Confirm differential and integral calculus within Mathematics and Physics.
- Confirm three experimental chemistry courses at 2000-level or above. CH 2630 and CH 2660 cannot both earn credit.
- Confirm 12/3 units of chemistry at 2000-level or above, including 2/3 unit of CH at 4000-level or above across the chemistry and additional science requirements.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/ch-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Mathematics and Physics: 2 completed, 0 planned.
- Inorganic Chemistry: 1 completed, 0 planned.
- Physical Chemistry: 2 completed, 1 planned.

`data/fixtures/ch-2030-edge.json` checks a different boundary. General chemistry can fill additional science, but not the 2000-level chemistry requirements. Experimental rows and unspecified biochemistry rows require confirmation; CH 2630 and CH 2660 cannot both count.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
