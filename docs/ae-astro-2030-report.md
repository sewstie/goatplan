# Aerospace Engineering, Astronautical — Class of 2030

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-04/AE---ASTRO-2030_fillable.pdf). This is the only source for degree rules. Checked November 8, 2026.

The PDF states “Effective for students entering AY 2026-2027”. Status stays beta with no student Workday verification.

## Requirement mapping

| App rows | Requirement |
| --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts |
| 7 | Wellness and Physical Education |
| 8, 9 | Social Science |
| 10, 11, 12 | Interactive Qualifying Project |
| 13, 14, 15 | Free Electives |
| 16, 17, 18, 19, 20, 21, 22 | Mathematics |
| 23, 24 | Physics |
| 25 | Chemistry |
| 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 | Core Aerospace Engineering |
| 37, 38, 39, 40, 41 | Astronautics Track |
| 42, 43, 44 | Major Qualifying Project |
| 45 | Aeronautics Elective |

The rows total 15 units. WPE and projects need explicit completion. Unlisted equivalents and fractional lab allocations require review.

## Manual review

- Confirm no more than 1/3 unit of AP credit in Humanities. The PDF does not state an IB limit.

## Hand-worked histories

The mid history has four completed courses and one planned course. The edge history tests exclusions, alternatives or track boundaries. Expectations are recorded in data/fixtures/ae-astro-2030-mid.json and ae-astro-2030-edge.json and exercised through EngineClient/WASM.

Aerodynamics belongs in the opposite-track elective. Aircraft design is not spacecraft design.

## Course map

The map uses official WPI 2026–27 course descriptions independently of the degree PDF. It shows recommended background, not enforced prerequisites. Aerospace shares a department map across both tracks. Topic-based preparation and alternatives without a safely expressible course chain remain notes. The map does not infer prerequisites from tracking-sheet row order.

## Validation

Lint and the production build passed. All 2,009 tests passed, with 10 existing native-only skips. Production browser checks passed at 1440px and 834px. The UI reviewer found no remaining blocking issues. Reference design PNGs are absent, so review used the established degree UI.
