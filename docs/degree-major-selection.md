# Choosing a degree sheet

My degree asks new visitors to choose a major before adding course history.
The picker supports Class of 2030. It uses the existing Listbox and opens in
a bottom sheet on phones. The selected major appears beside Change.

The registry controls availability. Checked sheets can appear in the public
picker when the degree release gate opens. Beta sheets require the existing
tester invitation. CS and RBE are registered beta sheets. The other launch
majors remain Coming soon until their own tickets add them.

The request action sends `degree_major_requested` with a `major` field.
It sends no course history, pins or confirmations.

## Saved history

The storage key remains `goatplan:history:v1`. Courses are shared. `sheetId`
records the selected sheet, and `sheets` stores manual confirmations and pins
by sheet id. The top-level `manual` and `pins` fields reflect the selected
sheet for the existing degree interface. Writes and exports update that
sheet's entry in `sheets`.

A history without `sheetId` opens CS without another picker prompt. Its
existing confirmations and pins belong to CS. Switching or exporting records
that association explicitly.

Exports contain the selection, courses and every saved sheet's state. Imports
validate course records, sheet ids, confirmations and pin structure before
review. Pin eligibility uses the incoming selected sheet. Merging keeps
existing course records, combines confirmations within each sheet, and keeps
existing pins when a course or line conflicts. The imported selection opens
after confirmation.

Switching clears the previous audit and search badges immediately. Responses
from older requests are ignored. Sheet labels come from sheet data; CS keeps
its existing display names.

## Checks

Run the source and browser suites from the repository root:

```sh
npm run lint
npm run test
npm run build
npm run test:e2e -w web -- degree-major.spec.ts --project=production
```

Run independent-sheet checks from `apps/web`:

```sh
npx playwright test --config playwright.degree-major.config.ts --workers=2
```

The latter builds an isolated copy under `.cache/degree-major` with a small,
independent fixture sheet. It tests the production app and real audit with
desktop keyboard and phone touch controls. Fixture sheets never enter the
normal registry or production build. The checks cover switching, reload,
all-sheet backups, cross-sheet pin validation, request events and lazy
downloads. The normal picker suite captures 1440, 834 and 375 px screenshots.

The design PNGs and `docs/design/frames.md` are absent in this checkout.
Screenshots are reviewed against the existing degree UI and the ticket.
