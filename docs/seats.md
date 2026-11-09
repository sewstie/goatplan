# Live seats

`GET /api/seats?term=2027-C` accepts a published term ID from the generated term
index. Invalid or unpublished IDs return 400. The server reads WPI's
`prod-data.json` and returns only section IDs, status, enrollment, capacity and
waitlist counts, plus `termId` and `fetchedAt`.

## Server cache

`lib/data/seatSource.ts` keeps the reduced listing for all published terms in
Next.js's data cache through `unstable_cache`, with a 900-second revalidation
interval. The large upstream response uses `no-store` and a 15-second timeout.
Concurrent requests in one server process share a single in-flight WPI request.

Failed upstream results are cached too, preventing one WPI request per visitor
during an outage. A missing usable snapshot returns an uncached 503. Successful
responses use `Cache-Control: public, max-age=0, s-maxage=900,
stale-while-revalidate=900`. Browser polling does not mean WPI is polled every
minute; the server cache determines freshness.

## Planner refresh

The planner asks for live seats alongside the daily term file. `withLiveSeats`
accepts only a snapshot for that term, with a valid timestamp at least as recent
as the daily file and at least one recognized section. It merges recognized
seat fields without replacing meetings, descriptions, instructors or options.

Changed counts are serialized into the engine's loaded term and trigger another
solve. Unchanged counts need no extra solve. The planner refreshes every minute
while visible and when the tab becomes visible again. Failed, malformed,
other-term or older snapshots fall back to the daily file's counts.

Saved and shared views preserve the section snapshots they were saved with.
Refreshing the draft's live seats does not rewrite those views.

## Display

`SeatStatus` appears in the desktop/tablet sidebar footer and the phone footer.
A successful refresh shows “Seats updated just now” or its age. Failure shows
“Seats from Nov 8” and Retry. The daily file's timestamp supplies that date.
The Workday reminder was removed intentionally and is not displayed in either
state. The status is hidden before usable data loads and in saved/shared views.

Retry replaces the failure state when it succeeds. If Retry had focus, focus
moves to the updated freshness status when the button disappears.

## Recommendations and tests

Published-term recommendations refresh live seats before checking availability,
using daily counts when the live request fails. They need an entire registration
option with available seats, including labs/discussions. Their schedule checker
marks numerically full sections closed in its own engine input even when the
source status still says open. The schedule checker runs on a separate worker.

Browser fixtures intercept `/api/seats` with frozen counts and a fresh timestamp.
`e2e/seats.spec.ts` checks freshness, daily fallback, Retry and merged counts at
1440, 834 and 375 px. These tests do not contact WPI.
