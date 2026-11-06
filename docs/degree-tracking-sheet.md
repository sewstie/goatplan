# My degree tracking sheet

My degree is a standalone sheet. The chosen major, course history, pins and
confirmations determine its audit. Changing a planner term or draft never changes
degree progress. My degree has no global Term picker and does not initialize the
schedule planner.

## History

Each course has a `status` of `taken` or `planned`. Only records explicitly added
to My degree as planned count toward planned progress. A term is optional. The
choices are A, B, C and D for each year from 2026 through 2030. A term does not
need published course data. Undated planned records stay undated in charts and
history groups.

The storage key remains `goatplan:history:v1`. New exports use version 2. Version 1
histories and imports migrate `inProgress: true` to `status: "planned"`; all other
legacy records become taken. Unsupported legacy dates become no term. Course
codes, titles, credits, AP/IB flags, credit sources, pins and confirmations stay.
Version 2 imports validate statuses and the allowed term range.

Search and manual entry both offer Taken / Planned and an optional term. Manual
entry remains available for AP, IB, transfer and retired courses. Paste first
shows a review. The student chooses “These are: Taken / Planned” for selected
records and can apply “Term for selected.” Nothing is stored until Add is chosen.
Duplicates keep their existing record.

## Catalog

`data/catalog.json` stores course codes, titles, credits, level, `offeredThisYear`
and observed `termLetters`. It is served at `/data/catalog.json`. Degree search
loads this catalog without loading planner term files.

`data/wpi-catalog-2026-27.json` seeds courses from the official
[WPI 2026–27 undergraduate catalog](https://wpi.cleancatalog.net/classes).
Units are converted to the app’s credit scale: one WPI unit is nine credits.
Cross-listed codes receive separate searchable entries. Variable credit values
stay null; adding one uses the existing three-credit default, which can be edited.
ISU, ISU BB and HU—AAS-50 are catalog identifiers without numbered WPI course
codes. They remain searchable and can be kept in history for review. They do not
enter candidate audits or fill requirements. Add the numbered registration code
manually when known.

`npm run data:catalog` merges published terms into the saved catalog. The daily
job runs it after normalization and commits the catalog with the term updates.
Existing courses and observed term letters are never deleted. The 2026–27
availability flag records offerings seen in 2026 A/B or 2027 C/D/E. Courses not
seen in that academic year show “Not offered in 2026–27” in search and can still
be added to the sheet.

## Explicit planner connections

The planner’s ⋯ menu offers “Add these courses to My degree as planned.” It
copies the displayed plan’s courses with its term and preserves existing history
records. Later planner changes do not change these copies. A planned history
record whose term has published data offers “Open in planner.”

“Suggest courses” opens a panel with its own term choice. Candidate audits use
the selected major and degree history. Results close missing lines or checks;
free-elective-only matches are excluded. The catalog supplies candidates even
when a future term has no published file.

Published offerings show “Offered · N sections.” “Plan for <term>” adds a planned
history record. “Add to schedule” explicitly opens that planner term and adds the
course to its draft. A course missing from that term can still be planned in My
degree, but has no Add to schedule action.

For unpublished terms, “Usually offered in <term letter>” appears only when the
catalog has observed that course in the same letter before. Otherwise the panel
shows “Offering not known yet.” These labels do not promise future availability.
Catalog, term-index and offering failures provide retries.
