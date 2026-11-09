# Environmental Engineering — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-06/EVE-2030_fillable.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “Effective for students entering AY 2026-2027”. The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines | Requirement | Units |
| --- | --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts | 2 |
| 7 | Wellness and Physical Education | 0.333333 |
| 8, 9 | Social Science | 0.666667 |
| 10, 11, 12 | Interactive Qualifying Project | 1 |
| 13, 14, 15, 16, 17, 18 | Mathematics | 2.0 |
| 19, 20, 21, 22, 23, 24 | Basic Science | 2.0 |
| 25 | Supplemental Science | 0.333333 |
| 26, 27, 28, 29, 30, 31 | Fundamental Engineering Science | 2.0 |
| 32, 33 | Environmental Engineering Core | 0.666667 |
| 34, 35 | Laboratory Experimentation | 0.666667 |
| 36, 37, 38, 39, 40 | Environmental Engineering Breadth and Depth | 1.666667 |
| 41, 42, 43 | Major Qualifying Project | 1.0 |
| 44, 45 | Free Electives | 0.666667 |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- Confirm differential and integral calculus, differential equations and statistics.
- Confirm introductory biology, environmental biology or biodiversity; three CH courses including equilibrium and kinetics; earth science; and calculus-based physics. GE 2341 is recommended.
- Confirm microbiology, ecology, spectroscopy or organic chemistry.
- Confirm at least 1/3 unit of capstone design within your MQP.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/eve-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Mathematics: 1 completed, 0 planned.
- Basic Science: 2 completed, 0 planned.
- Fundamental Engineering Science: 1 completed, 0 planned.
- Environmental Engineering Core: 1 completed, 1 planned.

`data/fixtures/eve-2030-edge.json` checks a different boundary. CE 2000 and ES 2501 are one solid-mechanics course. Both laboratory courses may count in separate lab slots. At most one of the three planning electives fills depth.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
