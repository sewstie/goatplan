# Current project checks

This page describes the implemented project and the checks used before shipping.
It replaces the November 1, 2026 launch snapshot. Results from older feature
snapshots live in the source reports and historical validation records; they
must not be treated as a current full-suite pass.

## Implemented scope

| Area | Current behavior |
| --- | --- |
| Planner | Published-term search, six sort presets, professor choices, locks, blocked times and schedule browsing |
| Diagnosis | Engine explanations and tested fixes, plus frontend searches for another lecture professor |
| Live seats | Server cache, visible-tab refresh, daily fallback, freshness and Retry |
| Plans | Browser-local saving, editable copies and registration snapshots |
| Sharing | Schedule payload in the URL fragment; explicit save/edit actions |
| Calendar | `.ics` downloads using term dates and calendar exceptions |
| My degree | Direct navigation; five Class of 2030 sheets, history, pins, confirmations and Plan ahead |
| Field choices | Requirement-specific catalog courses across terms, with usual offering letters |
| Recommendations | CS next-term previews check published seats and timetable fit before applying |
| Maps | Enabled for CS, RBE, ME, ECE and Data Science |
| Theme | Light/Dark across routes, with Light print output |

Individual Suggestions remains disabled by `SUGGESTIONS_ON = false`. This does
not disable field lists, candidate badges or CS next-term previews. The Workday
seat reminder and the recommendation panel's Still open/How this works sections
were intentionally removed.

## Verification commands

Run these for the checkout being shipped, after finishing code changes:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run data:test
```

For engine maintenance also run native tests, a matching-version WASM rebuild,
the native/WASM smoke comparison and a generated-asset diff. The pinned toolchain
and macOS notes are in [development](development.md).

Review desktop, tablet and phone captures and keyboard focus. A subset of E2E,
a source report, or fixture validation cannot substitute for a full E2E result.
Port-binding, font-fetch and browser-launch restrictions are infrastructure
failures; record them explicitly when they block verification.

Seat tests cover both success and fallback without expecting the removed notice.
Phone menu tests keep their focus assertion: closing or removing a dialog must
close the menu and return focus to More actions. The direct return target and
unit regressions are described in [architecture](frontend-architecture.md).

## Academic verification

All five registry entries are beta and have no recorded student verification.
They are selectable in the app. Marking a sheet checked requires an actual
student comparison with Workday and metadata passing schema validation.

The worked histories establish the app's interpretation of source documents.
They do not establish that WPI accepts a student's substitutions, thematic HUA
choices, residency, project credit, engineering design distribution or total
credit. Those checks remain visible for explicit review. A non-CS social course
supports the CS social check without creating CS units or duplicating its credit.

WPE requires recorded activity or explicit confirmation. A project block reserves
a planning term but does not confirm the corresponding requirement. Graduate
equivalence and approved substitutions remain separate from ordinary matching.

## External checks

Record real evidence before claiming any of the following:

- Student-by-student Workday agreement, advisor-approved substitutions and sheet verification.
- Successful Google Calendar and Apple Calendar imports, including date exceptions and daylight saving.
- Production analytics delivery. The event helper requires configuration and a loaded Umami client; the root layout does not install it.
- Usability feedback or owner screenshot approval. Automated fixtures are not a friend test.
- A deployment or public release decision. Source changes and a Git push alone do not prove deployment.

The removed source watcher is not part of current maintenance. Daily course-data
updates and cached live seats remain. No personal outreach or external account
setup is performed by the project checks.

## Local integration check, November 8, 2026

The documentation refresh checked the current working tree, including the
planner-to-degree review controls, seat-test updates and phone dialog focus fix.
Local Markdown file links, heading targets, code fences and the data-format JSON
example were validated. No engine, script or generated asset files were changed.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run test -w web -- --maxWorkers=2` | 1,911 passed, 10 skipped |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | Passed |
| `npm run build` | Passed |
| `npm run data:test` | 119 passed |
| `npm run test:e2e` | 539 passed, 9 skipped, 17 failed at screenshot comparisons |
| `npm run test:e2e -w web -- --ignore-snapshots` | 556 passed, 9 skipped; matches CI configuration |

The default-concurrency unit run initially hit six timeouts while other checks
were running. The complete lower-concurrency rerun passed. The recorded E2E
failures are in calendar selection, lab previews, professor controls, sorting,
the guide and visit banners. Comparison images include an older planner header,
sidebar and instructor-link layout. They have not been silently regenerated.
The full local screenshot suite is therefore not green. CI explicitly skips
these platform-specific comparisons; its behavior-only command is
`npm run test:e2e -w web -- --ignore-snapshots`.

A later stress run of the phone menu-close test (`--repeat-each=20 --workers=3`)
still failed the More actions focus assertion in 3 runs, with 17 passing. The
single successful full behavioral run does not resolve this intermittent failure.
The direct dialog focus target and unmount regressions pass in Vitest, but the
native browser timing issue needs further diagnosis. A follow-up instrumented
browser attempt was blocked before tests by Turbopack's sandbox port-binding
error. No debug instrumentation remains in source.

Git integration was also blocked when the workspace denied creating
`.git/index.lock`. The checked edits were not committed, merged or pushed by that
attempt. Re-run verification and integration when Git writes and browser startup
are available.
