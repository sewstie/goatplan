# Documentation

The guides describe the current source tree. Requirement-source reports retain
academic interpretations and their original validation evidence; their test
counts are not a claim about the current checkout.

## Development and contracts

| Guide | Use it for |
| --- | --- |
| [Development](development.md) | Setup, commands, CI, ports, native/WASM builds and local limitations |
| [Planner and saved schedules](planner.md) | Course choices, diagnosis, saving, sharing and calendar export |
| [Frontend architecture](frontend-architecture.md) | Routes, module boundaries, state, responsive UI and focus behavior |
| [Data format](data-format.md) | Published term JSON, sections, valid options and the persistent catalog |
| [Engine API](engine-api.md) | Version 1 solve, diagnosis and generic audit contracts |
| [Live seats](seats.md) | Server caching, refresh, merging and fallback behavior |
| [Theme behavior](degree-dark-theme.md) | Theme persistence, controls, tokens, contrast and print |
| [Current project checks](launch-check.md) | Implemented scope, verification commands and remaining external checks |

## My degree

| Guide | Use it for |
| --- | --- |
| [Tracking sheet](degree-tracking-sheet.md) | History, credit entry, fields, plan grid and planner connections |
| [Major selection](degree-major-selection.md) | Supported sheets, switching, per-sheet state and verification metadata |
| [Recommendations](course-recommendations.md) | Area-specific courses and CS next-term selection |
| [Course maps](degree-course-map.md) | Shared map behavior and non-CS maps |
| [CS map](cs-course-map.md) | CS layout, background expressions and arrow routing |

## Requirement sources and interpretations

These files explain the rules encoded for the Class of 2030. They do not certify
graduation eligibility or replace the selected sheet's unresolved confirmations.
All five sheets are selectable in the current UI, with beta registry status and
no student verification recorded.

- [Computer Science](cs-2030-report.md)
- [Robotics Engineering](rbe-2030-report.md)
- [Mechanical Engineering](me-2030-report.md)
- [Electrical and Computer Engineering](ece-2030-report.md)
- [Data Science](ds-2030-report.md)

## Historical validation

[Standalone-degree validation](degree-standalone-validation.md) and
[the dark-theme release record](dark-theme-release.md) retain results from their
original implementation snapshots. Their old failure lists and release plans
are not current project status. Re-run the commands in [development](development.md)
for the checkout being shipped.

The original `docs/design/frames.md` and `docs/design/screens/` references named
in repository instructions are absent. Existing UI tokens, current components
and browser captures provide the available visual evidence.
