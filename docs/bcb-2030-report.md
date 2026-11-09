# Bioinformatics and Computational Biology — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-04/BCB-2030.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “Effective for students entering AY 2026-2027”. The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines | Requirement | Units |
| --- | --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts | 2 |
| 7 | Wellness and Physical Education | 0.333333 |
| 8, 9 | Social Science | 0.666667 |
| 10, 11, 12 | Interactive Qualifying Project | 1 |
| 13, 14, 15 | Free Electives | 1 |
| 16, 17, 18, 19, 20 | Mathematics Foundation | 1.666667 |
| 21, 22, 23, 24 | Computer Science Foundation | 1.333333 |
| 25, 26, 27, 28, 29 | Biology Foundation | 1.666667 |
| 30, 31, 32, 33 | Chemistry Foundation | 1.333333 |
| 34, 35 | Bioinformatics and Computational Biology | 0.666667 |
| 36 | Social Implications | 0.333333 |
| 37, 38, 39, 40, 41, 42 | Advanced Elective Courses | 2.0 |
| 43, 44, 45 | Major Qualifying Project | 1.0 |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- Confirm 2/3 unit differential and integral calculus, 1/3 unit linear algebra, 1/3 unit statistics, and one additional statistics, probability, calculus or differential equations course.
- Confirm one 1000-level and one 2000-level introductory programming course from the approved foundation list, plus discrete mathematics and algorithms. The PDF refers to an external list; that list is not inferred here.
- Confirm cell biology or genetics, two approved lecture courses, and 1/3 unit of 2000-level BB laboratories. The optional 29.5 row is the second half of line 29, not extra credit.
- Confirm 2/3 unit general chemistry and 1/3 unit organic chemistry. The fourth course must be general chemistry, organic chemistry or biochemistry.
- Confirm six courses from the approved advanced electives list, including at least three in the most related to BCB category. The PDF refers to a list outside the PDF, so eligibility requires confirmation.
- Confirm four courses at 4000-level for the major overall and an MQP advisor with a formal collaborative BCB appointment. No course may fill two requirements.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/bcb-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Mathematics Foundation: 2 completed, 0 planned.
- Computer Science Foundation: 1 completed, 0 planned.
- Biology Foundation: 1 completed, 0 planned.
- Chemistry Foundation: 1 completed, 0 planned.
- Social Implications: 0 completed, 1 planned.

`data/fixtures/bcb-2030-edge.json` checks a different boundary. The two equivalence pairs cannot earn four BCB placements. The external elective list is not in the PDF, so advanced electives and lab allocations stay unconfirmed.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
