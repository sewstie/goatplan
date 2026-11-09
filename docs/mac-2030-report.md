# Actuarial Mathematics — Class of 2030

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-08/MAC-2030_fillable.pdf). This is the only source for degree rules. Checked November 8, 2026.

The PDF states “Effective for students entering AY 2026-2027”. Status stays beta with no student Workday verification.

## Requirement mapping

| App rows | Requirement |
| --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts |
| 7 | Wellness and Physical Education |
| 8, 9 | Social Science |
| 10, 11, 12 | Interactive Qualifying Project |
| 13, 14, 15 | Free Electives |
| 16, 17, 18 | Transition Courses |
| 19, 20, 21, 22 | Core Mathematics |
| 23 | Actuarial Mathematics |
| 24, 25, 26 | Actuarial Electives |
| 27, 28, 29, 30, 31, 32, 33, 34 | Introductory and Other Mathematics |
| 35, 36, 37 | Major Qualifying Project |
| 38, 39 | Basic Science |
| 40, 41 | Computer Science or Data Science |
| 42, 43, 44, 45 | Business |

The rows total 15 units. WPE and projects need explicit completion. Unlisted equivalents and fractional lab allocations require review.

## Manual review

- Confirm no more than 1/3 unit of AP credit in Humanities. The PDF does not state an IB limit.
- Confirm MA 321X, MA 322X, equivalents and any independent study. Independent studies for Society of Actuaries exams must not repeat material from a WPI course.
- Confirm MA 4216 attendance in at least four terms. This zero-unit graduation requirement does not add academic credit.

## Hand-worked histories

The mid history has four completed courses and one planned course. The edge history tests exclusions, alternatives or track boundaries. Expectations are recorded in data/fixtures/mac-2030-mid.json and mac-2030-edge.json and exercised through EngineClient/WASM.

Transition alternatives cannot fill two transition rows; FIN 1250 cannot fill Business. Four terms of zero-credit seminar stay unconfirmed.

MA 4216 is excluded from academic credit even if entered with a positive credit value. Its four-term attendance requirement remains a separate manual check. The edge history verifies this exclusion.

The generic nonCreditCourses metadata normalizes MA 4216 to zero credits at the EngineClient boundary for completed, planned and candidate records. It also excludes the seminar from frontend matching and earned-credit totals. Saved history remains unchanged. The regression checks math, free-elective and earned credit separately. This behavior is verified through the browser client and WASM, not a raw native CLI request.

## Validation

Lint and the production build passed. All 2,009 tests passed, with 10 existing native-only skips. Production browser checks passed at 1440px and 834px. The UI reviewer found no remaining blocking issues. Reference design PNGs are absent, so review used the established degree UI.
