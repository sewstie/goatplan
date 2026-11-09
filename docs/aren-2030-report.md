# Architectural Engineering — Class of 2030

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-08/AREN-2030_fillable.pdf). This is the only source for degree rules. Checked November 8, 2026.

The PDF states “Effective for students entering in AY 2026-2027”. Status stays beta with no student Workday verification.

## Requirement mapping

| App rows | Requirement |
| --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts |
| 7 | Wellness and Physical Education |
| 8, 9 | Social Science |
| 10, 11, 12 | Interactive Qualifying Project |
| 13, 14, 15, 16, 17, 18, 19 | Mathematics |
| 20, 21 | Physics |
| 22 | Chemistry |
| 23, 24 | Math and Basic Science Electives |
| 25, 26 | Architectural Engineering Complements |
| 27, 28 | Construction and Construction Management |
| 29, 30, 31, 32, 33 | Building Mechanical Systems |
| 34, 35 | Building Electrical Systems |
| 36, 37, 38 | Building Structural Engineering |
| 39, 40 | Structural Design Electives |
| 41, 42 | General Architectural Design |
| 43, 44, 45 | Major Qualifying Project |

The rows total 15 units. WPE and projects need explicit completion. Unlisted equivalents and fractional lab allocations require review.

## Manual review

- Confirm no more than 1/3 unit of AP credit in Humanities. The PDF does not state an IB limit.
- Confirm two design-level structural engineering courses, such as CE 3006, CE 3008, CE 3010 or CE 3044. The audit uses its required credit pool for these rows; other extra courses do not establish eligibility.
- Confirm structural or mechanical capstone proficiency through the MQP, and 1/3 unit of experimentation from AREN 3003, AREN 3020, ME 3901, CE 3026 or an approved equivalent.

The PDF has no free electives. The engine requires one credit pool; rows 39–40 use that pool for structural design credit. Its allocation is provisional until the structural approval check is confirmed. No extra course is automatically certified as a structural elective.

## Hand-worked histories

The mid history has four completed courses and one planned course. The edge history tests exclusions, alternatives or track boundaries. Expectations are recorded in data/fixtures/aren-2030-mid.json and aren-2030-edge.json and exercised through EngineClient/WASM.

Pool credit alone does not prove that both structural electives are approved design courses. A CS course does not establish structural design credit.

## Course map

The map uses official WPI 2026–27 course descriptions independently of the degree PDF. It shows recommended background, not enforced prerequisites. Aerospace shares a department map across both tracks. Topic-based preparation and alternatives without a safely expressible course chain remain notes. The map does not infer prerequisites from tracking-sheet row order.

## Validation

Lint and the production build passed. All 2,009 tests passed, with 10 existing native-only skips. Production browser checks passed at 1440px and 834px. The UI reviewer found no remaining blocking issues. Reference design PNGs are absent, so review used the established degree UI.
