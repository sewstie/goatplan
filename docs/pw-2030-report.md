# Professional Writing — Class of 2030

Source checked November 8, 2026.

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-04/PW-2030.pdf). This PDF is the only curriculum source used for this sheet.

The entering-year header reads “STUDENTS ENTERING AY 2026-2027”. The registry stays beta, with no student Workday verification. The existing catalogSource field points to the WPI directory; no catalog rules were imported.

## Requirement mapping

| Lines | Requirement | Units |
| --- | --- | --- |
| 1, 2, 3, 4, 5, 6, 7 | Writing and Rhetoric Core | 2.333333 |
| 8, 9 | Communication Electives | 0.666667 |
| 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21 | Subject-Matter Concentration | 4.0 |
| 22, 23, 24, 25, 26, 27 | Scientific/Technical Electives | 2.0 |
| 28, 29, 30, 31, 32, 33 | Humanities and Arts | 2.0 |
| 34, 35 | Social Science | 0.666667 |
| 36, 37, 38 | Interactive Qualifying Project | 1.0 |
| 39, 40, 41 | Free Electives | 1.0 |
| 42 | Physical Education | 0.333333 |
| 43, 44, 45 | Major Qualifying Project | 1.0 |

The numbered lines total 15 units. WPE requires four courses or an explicit sports confirmation. Empty history never satisfies WPE. Projects require explicit confirmation.

The optional line 46 applies only to an interdisciplinary MQP. The default sheet shows the single-major path, lines 1–45. The PDF permits shared courses, but automatic placement counts a course once. A shared-course path must be reconciled with an advisor; it is not automatically certified by this sheet. HUA maps to lines 28–33 and WPE to line 42.

## Checks requiring confirmation

- Confirm that no more than 1/3 unit of AP credit counts toward Humanities and Arts. The PDF states an AP limit; it does not give an IB limit.
- Confirm at most one 1000-level course and one of WR 2210, WR 2450, WR 3210, WR 3450 or WR 4210. A WR-focused HU 3900/3910 needs approval by Professional Writing faculty or the Program Review Committee.
- Confirm both communication electives are approved. Other approved electives need manual review. ID 2050 and AP credit cannot count. These courses cannot overlap WPI free electives.
- Confirm four units in one discipline, or two units in each of two disciplines, unless shared with a second major.
- Confirm two units of approved scientific or technical electives.
- The PDF permits up to five writing-core courses shared with HUA, up to two communication electives shared elsewhere except free electives, and shared scientific/technical electives. This audit places each course once; confirm shared allocations and credit with your advisor. An interdisciplinary MQP needs 4/3 units, including optional line 46; the default sheet shows the single-major one-unit MQP.
- Confirm depth, breadth, the HUA elective, and completion of all five HUA courses before Inquiry. Review the modern-language exception.

Where the PDF names a topic but omits eligible course codes, the topic remains a manual confirmation. Where it refers to an external approved list, that list was not invented or read from another source. Course patterns are expanded into existing generic course filters before auditing. The engine and WASM files are unchanged.

## Hand-worked histories

`data/fixtures/pw-2030-mid.json` has 5 completed courses and one planned course. Expected section counts were worked from the PDF:

- Writing and Rhetoric Core: 3 completed, 1 planned.
- Social Science: 1 completed, 0 planned.
- Scientific/Technical Electives: 1 completed, 0 planned.

`data/fixtures/pw-2030-edge.json` checks a different boundary. The research-methods alternatives cannot both fill the named core row. ID 2050 is social science, not a communication elective. Concentration, shared credit and interdisciplinary MQP credit require explicit review.

Both histories leave interpretation checks open. They are not claims of degree completion. The integration tests send these histories through EngineClient and the committed WebAssembly audit, then compare the hand-worked counts and open lines.

This checklist does not state a residency minimum. No residency number or automatic residency check is added from another source.

## Validation

Lint, the production build and all 1,964 tests passed; 10 existing native-only tests were skipped. Both hand-worked histories passed through the committed WASM audit. Browser checks covered selection, audit loading, persistence, keyboard navigation and screenshots at 1440px and 834px. The UI reviewer found no blocking issues. Design reference PNGs are absent, so visual review used the established degree UI.
