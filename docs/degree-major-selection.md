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
| `bbt-2030` | Biology and Biotechnology | 45 | beta |
| `bc-2030` | Biochemistry | 45 | beta |
| `ch-2030` | Chemistry | 45 | beta |
| `bcb-2030` | Bioinformatics and Computational Biology | 45 | beta |
| `eve-2030` | Environmental Engineering | 45 | beta |
| `baaai-2030` | Business Analytics and Applied AI | 45 | beta |
| `mkt-2030` | Marketing Analytics | 45 | beta |
| `pw-2030` | Professional Writing | 45 | beta |

| `mac-2030` | Actuarial Mathematics | 45 | beta |
| `ae-aero-2030` | Aerospace Engineering, Aeronautical | 45 | beta |
| `ae-astro-2030` | Aerospace Engineering, Astronautical | 45 | beta |
| `aren-2030` | Architectural Engineering | 45 | beta |
| `ai-2030` | Artificial Intelligence | 45 | beta |
| `bme-2030` | Biomedical Engineering | 47 internal rows | beta |

All nineteen sheets are selectable. Each has `verification: null`; beta metadata
currently does not hide a sheet from the picker. A checked sheet must have a
student name and dated Workday verification in registry metadata. Source and
fixture checks do not supply that verification.

The eight new sheets use only the PDFs linked from WPI's Program Tracking
Sheets page. Their individual reports record the entering-year header and
the limits of automatic matching. Course-number patterns expand into existing
course filters when the selected sheet loads. Topics without course lists and
fractional laboratory allocations require explicit confirmation. Professional
Writing defaults to its single-major MQP; shared coursework and the optional
interdisciplinary MQP require advisor review.

Unimplemented majors from the WPI directory appear as Coming soon and can be
requested. The list scrolls within the picker so its actions stay visible.

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

The six later additions are MAC, both AE tracks, AREN, AI and BME. Engineering course maps use official course descriptions separately from PDF-only degree rules. BME uses 47 internal rows because its PDF is unnumbered. AREN structural-design credit remains provisional until approved.
