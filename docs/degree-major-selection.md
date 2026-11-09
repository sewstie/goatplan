# Choosing a degree sheet

My degree is available at `/degree` without an invitation flag. New visitors
choose a major before entering history. Changing the major later opens the same
radio-list form in a dialog. The picker supports the Class of 2030, starting in
A Term 2026; other class years, minors and double majors are not supported.

## Current sheets

`lib/degree/sheets/index.ts` is the registry and lazy-loader map.

| ID | Major | Numbered lines | Registry status |
| --- | --- | --- | --- |
| `cs-2030` | Computer Science | 45 | beta |
| `rbe-2030` | Robotics Engineering | 46 | beta |
| `me-2030` | Mechanical Engineering | 45 | beta |
| `ece-2030` | Electrical and Computer Engineering | 45 | beta |
| `ds-2030` | Data Science | 45 | beta |

All five sheets are selectable. Each has `verification: null`; beta metadata
currently does not hide a sheet from the picker. A checked sheet must have a
student name and dated Workday verification in registry metadata. Source and
fixture checks do not supply that verification.

My major isn't listed accepts a request. `degree_major_requested` sends the
requested major through the optional analytics helper, without course history,
pins or confirmations. The UI's thank-you message does not guarantee delivery
when analytics is not configured or loaded.

## Saved history and switching

The storage key remains `goatplan:history:v1`, with version 2 exports. Courses
are shared across majors. `sheetId` identifies the selection, and `sheets` keeps
manual confirmations and pins per sheet. Top-level `manual` and `pins` reflect
the selected sheet; writes and exports update its entry in `sheets`.

`huaPath` records the student's humanities path once, across majors. See
[Humanities path](degree-tracking-sheet.md#humanities-path).

An existing history without `sheetId` opens CS rather than asking for a major.
Its confirmations and pins belong to CS. Switching or exporting makes that
association explicit. A fresh history has no selected sheet until the student
chooses one.

Switching clears the previous audit and search badges immediately. Old responses
are ignored. Only the requested sheet JSON is imported. The audit receives the
selected effective sheet, including the humanities path, on each app request.
The engine does not need a separate implementation for each major.

## Backups and imports

Exports include courses, the selected sheet and every saved sheet's state.
Imports validate course records, known sheet IDs, manual confirmations and pin
structure before review. Pin eligibility is checked against the incoming sheet.
Merging keeps existing course records and conflicting pins, combines compatible
confirmations, and applies the imported selection after confirmation.

## Validation

Run the normal checks from the repository root:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e -w web -- degree-major.spec.ts --project=production
```

`npm run test:degree-sheets -w web` validates all registered documents against
`degree-rules.schema.json` and checks references, line totals, cross-lists and
verification metadata.

The independent fixture-sheet harness runs with:

```bash
npm exec -w web -- playwright test --config playwright.degree-major.config.ts --workers=2
```

It builds an isolated copy under `.cache/degree-major` and exercises switching,
reload, backups, pin validation, request events and lazy downloads against the
real app and audit. Fixture sheets never enter the production registry.
Normal browser specs capture desktop, tablet and phone. The original design
reference PNGs are absent; review current captures against the implemented UI.
