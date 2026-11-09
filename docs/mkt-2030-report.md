# Marketing Analytics — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-05/BS-MA---Class-of-2030.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “Effective for students entering AY 2026 (2026-2027)”. The business PDF spells out the same cohort as AY 2026 (2026–2027). The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines | Requirement | Units |
| --- | --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts | 2 |
| 7 | Wellness and Physical Education | 0.333333 |
| 8, 9, 10, 11, 12 | Mathematics | 1.666667 |
| 13 | Computer Science | 0.333333 |
| 14, 15 | Basic Science | 0.666667 |
| 16, 17 | Social Sciences | 0.666667 |
| 18, 19, 20 | Interactive Qualifying Project | 1.0 |
| 21, 22, 23, 24, 25 | Business Foundation Courses | 1.666667 |
| 26, 27, 28, 29 | Technical and AI Foundation Courses | 1.333333 |
| 30, 31, 32, 33 | Analytics Foundation Courses | 1.333333 |
| 34, 35, 36, 37, 38, 39 | Marketing Analytics Electives | 2.0 |
| 40, 41, 42 | Major Qualifying Project | 1.0 |
| 43, 44, 45 | Free Electives | 1.0 |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- The PDF permits equivalent foundation courses. Confirm any approved substitutions with your advisor.
- Confirm four or five Marketing Analytics electives and at most two Management and Entrepreneurship electives. The PDF says four or five, so six marketing electives also need advisor review.
- Confirm your MQP is advised by a full-time WBS marketing faculty member: Hall-Phillips, Ed Gonsalves, Farnoush Reshadi or Purvi Shah.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/mkt-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Mathematics: 1 completed, 0 planned.
- Computer Science: 1 completed, 0 planned.
- Social Sciences: 1 completed, 0 planned.
- Business Foundation Courses: 1 completed, 0 planned.
- Technical and AI Foundation Courses: 1 completed, 1 planned.

`data/fixtures/mkt-2030-edge.json` checks a different boundary. Each cross-listed pair counts once. Three marketing electives, one planned, do not complete the six-course distribution.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
