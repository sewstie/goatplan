# Standalone degree validation

Checked on November 6, 2026. Existing local major-release edits were preserved.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed without warnings |
| `npm run test` | 1,694 passed, 10 skipped |
| `npm run build` | Passed, including the static catalog route |
| `npm run engine:test` | 163 passed |
| `npm run data:test` | 132 passed |
| `npm run test:e2e -w web -- degree course-map --workers=4` | 98 passed, 5 fixture tests skipped |
| `git diff --check` | Passed |

The browser run covers migration without published term data, catalog-only and
unusual identifiers, catalog retry, explicit planner transfer, Add to schedule,
future-term offering labels, paste review, all five majors, pins, keyboard
navigation, phone layouts and deferred sheet loading.

The catalog contains 1,487 records. Of these, 340 have no observed offering in
the published 2026–27 data. Three catalog identifiers lack numbered registration
codes. They stay in history for review and cannot break the audit.

## Screenshots and review

Screenshots are in `apps/web/e2e/screenshots/`:

- `degree-standalone-1440.png`, `degree-standalone-834.png`, `degree-standalone-375.png`
- `degree-suggestions-1440.png`, `degree-suggestions-834.png`, `degree-suggestions-375.png`

The UI reviewer found no blocking issues in the main sheet or suggestion panel
at these widths. The design PNG comparison could not run because
`docs/design/frames.md` and `docs/design/screens/` are absent from this checkout.

## Full-suite limitation

The full repository run, `npm run test:e2e -w web -- --workers=4`, completed with
363 passed, 183 failed and 5 skipped. Degree-specific failures from that run were
corrected and the complete degree/course-map selection then passed as shown
above. The full repository suite is still not green.

Three representative planner failures were also reproduced in a temporary copy
of unchanged `HEAD`: both calendar-selection screenshot tests and the 1440px
planner-height test. The snapshots expect an older planner layout. Broader
failures also include planner sizing, labels, menus and old typography
expectations. They have not all been individually attributed to the baseline.
The feature does not claim that the entire repository e2e requirement passed.
