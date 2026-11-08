# Live seats

`GET /api/seats?term=2027-C` takes a published term id. On the server it fetches WPI's `prod-data.json` and answers with only the seat fields of that term's sections (id, status, enrolled, capacity, waitlist), plus the term id and when it was fetched.

The reduced listing for all published terms is kept in Next.js's data cache with `unstable_cache` and `revalidate: 900`, so WPI is asked at most once every 15 minutes. The big upstream file itself uses `no-store`. A good answer has `Cache-Control: public, max-age=0, s-maxage=900, stale-while-revalidate=900`.

Only one WPI request runs at a time on each server: requests that arrive while it runs, for any term, wait for the same answer. A failed WPI request is cached as a failure too, so an outage doesn't become one WPI request per visitor. Visitors then get an uncached 503.

When the planner loads a term, it asks for live seats at the same time. Once both are in, it merges the seats into the term (`withLiveSeats` in `lib/data/seatMerge.ts`), gives the engine the merged term and solves again, but only if a count actually changed. It asks again every minute while the tab is visible and when the tab comes back. Seats that fail to load, are malformed, belong to another term or are older than the daily file are dropped, and the daily file's counts stay.

The sidebar footer (and, on phones, the line above the preferences) says "Seats updated 5 min ago" and "Confirm in Workday before you register." When live seats couldn't be had it shows "Seats from Nov 8 · Retry" instead. Saved and shared plans keep the seats they were saved with, so the line is hidden there.

The browser tests never reach WPI: `e2e/fixtures/test.ts` answers `/api/seats` with the frozen term's seats, fetched "just now".
