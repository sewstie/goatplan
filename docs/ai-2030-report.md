# Artificial Intelligence — Class of 2030

[WPI Program Tracking Sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets) links to the [official PDF](https://www.wpi.edu/sites/default/files/2026-07/AI-2030_fillable_update.pdf). This is the only source for degree rules. Checked November 8, 2026.

The PDF states “Effective for students entering AY 2026-2027”. Status stays beta with no student Workday verification.

## Requirement mapping

| App rows | Requirement |
| --- | --- |
| 1, 2, 3, 4, 5, 6 | Humanities and Arts |
| 7 | Wellness and Physical Education |
| 8, 9 | Social Science |
| 10, 11, 12 | Interactive Qualifying Project |
| 13, 14, 15 | Free Electives |
| 16, 17, 18 | Computer Science Foundation |
| 19, 20, 21, 22, 23 | Mathematical Sciences |
| 24, 25, 26 | AI Foundations |
| 27, 28, 29, 30, 31 | AI Core |
| 32 | AI Ethics and Social Implications |
| 33, 34 | Disciplinary Electives |
| 35, 36, 37, 38, 39, 40 | Concentration |
| 41, 42 | Natural and Engineering Science |
| 43, 44, 45 | Major Qualifying Project |

The rows total 15 units. WPE and projects need explicit completion. Unlisted equivalents and fractional lab allocations require review.

## Manual review

- Confirm no more than 1/3 unit of AP credit in Humanities. The PDF does not state an IB limit.
- Confirm six distinct courses from one of the eleven page-two concentrations, including every required course, category minimum and level restriction. The two disciplinary electives may come from any concentration or the AI core. Confirm any approved graduate options.
- Confirm at least two 4000-level core courses and four 4000-level courses overall. MQP must apply AI within the chosen concentration and have advisor appointments in AI and that concentration.

All eleven concentrations are available through manual approval of rows 35–40 using page two of the PDF. The app does not pick a concentration or mix its lists automatically.

## Hand-worked histories

The mid history has four completed courses and one planned course. The edge history tests exclusions, alternatives or track boundaries. Expectations are recorded in data/fixtures/ai-2030-mid.json and ai-2030-edge.json and exercised through EngineClient/WASM.

Cross-listed machine learning counts once. Concentration credit stays unconfirmed; courses cannot be shared with core requirements.

## Validation

Lint and the production build passed. All 2,009 tests passed, with 10 existing native-only skips. Production browser checks passed at 1440px and 834px. The UI reviewer found no remaining blocking issues. Reference design PNGs are absent, so review used the established degree UI.
