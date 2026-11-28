# Biomedical Engineering — Class of 2030

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-06/BME-2030_fillable.pdf). This is the only source for degree rules. Checked November 8, 2026.

The PDF states “students entered WPI Fall 2026 or later”. Status stays beta with no student Workday verification.

The PDF uses Fall 2026 wording, not the literal AY header. Its requirement rows are unnumbered. The app uses internal rows 1–47; four laboratory rows carry 1/6 unit each. These are internal identifiers, not official PDF line numbers. The PDF omits a residency minimum and detailed HUA rules, so those need advisor review.

## Requirement mapping

| App rows               | Requirement                     |
| ---------------------- | ------------------------------- |
| 1, 2, 3, 4, 5, 6       | Humanities and Arts             |
| 7                      | Wellness and Physical Education |
| 8, 9                   | Social Science                  |
| 10, 11, 12             | Interactive Qualifying Project  |
| 13                     | Free Electives                  |
| 14, 15, 16, 17, 18, 19 | Mathematics                     |
| 20, 21                 | Biology                         |
| 22, 23                 | Chemistry                       |
| 24, 25                 | Physics                         |
| 26                     | Supplemental Science            |
| 27                     | Computer Programming            |
| 28                     | Human Physiology 3000+          |
| 29, 30, 31             | Major Qualifying Project        |
| 32, 33, 34, 35         | Engineering Distribution        |
| 36, 37, 38             | Engineering 2000+               |
| 39                     | Engineering Design              |
| 40, 41, 42, 43         | BME Laboratories                |
| 44, 45                 | Engineering 3000+               |
| 46, 47                 | BME Depth 4000+                 |

The rows total 15 units. WPE and projects need explicit completion. Unlisted equivalents and fractional lab allocations require review.

## Manual review

- Confirm HUA allocation with your advisor. This PDF does not specify AP or IB limits.
- Confirm 9/3 units of BME within 14/3 engineering units, at most one graduate course, an approved living systems lab and a 3000/4000-level focus pair. Labs cannot fill BME depth. BME 595 needs departmental approval. Confirm capstone design through your MQP advisor or BME 4301. Programming, human physiology and the four engineering topic rows refer to external approved lists and require confirmation.
- Confirm the required science topics and any approved equivalents. At least one biology course must be at 2000-level or above.

## Hand-worked histories

The mid history has four completed courses and one planned course. The edge history tests exclusions, alternatives or track boundaries. Expectations are recorded in data/fixtures/bme-2030-mid.json and bme-2030-edge.json and exercised through EngineClient/WASM.

Human physiology is excluded from engineering credit. A 4000-level lab cannot fill BME depth. Labs require completed focus-pair confirmation.

## Course map

The map uses official WPI 2026–27 course descriptions independently of the degree PDF. It shows recommended background, not enforced prerequisites. Aerospace shares a department map across both tracks. Topic-based preparation and alternatives without a safely expressible course chain remain notes. The map does not infer prerequisites from tracking-sheet row order.

## Validation

Lint and the production build passed. All 2,009 tests passed, with 10 existing native-only skips. Production browser checks passed at 1440px and 834px. The UI reviewer found no remaining blocking issues. Reference design PNGs are absent, so review used the established degree UI.
