# 02: Engine: rank by the chosen measure first

Ticket: 02
Wave: 1
Status: OPEN
Blocked By: none

**Track:** ENGINE (allowed for this work; same structure and formatting, no comments, commits separate from the UI)

**What to build:** A request can name one measure to rank by. The engine then puts the schedule that's best on that measure first, among every schedule it checks. Ties fall back to the Best overall score and then to section order. Requests without it rank exactly as today. Runs in parallel with 01 and 04.

- [ ] `docs/engine-api.md` changes first. It lists `sort.primary`, the five new score fields, the comparison chain and the capped-search note as additive to version 1.
- [ ] `sort.primary` takes `earlyMinutes`, `firstStart`, `lastEnd`, `days` or `freeMinutes`. Missing or `null` means today's ranking. Any other value gives `badRequest` with `sort.primary` in `detail`.
- [ ] New score fields, in minutes. Classes with no set time don't count, and `gapMinutes` keeps its meaning.
  - `firstStart`: the week's earliest class start.
  - `lastEnd`: the week's latest class end.
  - `averageStart`: the average of each day's first start, over days with class, rounded to the minute.
  - `averageEnd`: the same for each day's last end.
  - `freeMinutes`: the sum of same-day breaks longer than 10 minutes.
- [ ] One comparison chain, used both for keeping the best N and for the final order:
  1. the primary measure (`firstStart` is better when higher; the others when lower);
  2. for `firstStart`, then `averageStart` (higher is better); for `lastEnd`, then `averageEnd` (lower is better);
  3. `total`;
  4. the existing section-order tie-break.
- [ ] When the search runs out of steps, `primary` ranks only the schedules found, as the contract doc says.
- [ ] Tests:
  - For every `primary`, the #1 schedule equals a brute-force best over all valid schedules on a fixed course set, with `maxSchedules` 5.
  - The second step orders schedules that are equal on `firstStart` or `lastEnd`, and is fair to schedules with fewer days.
  - Ties fall back to `total`, then section order.
  - Back-to-back 10-minute breaks give `freeMinutes` 0.
  - An unknown `primary` gives `badRequest`.
  - The existing golden answers don't change.
- [ ] The WebAssembly build is rebuilt and committed with the engine source and is reproducible. The wasm smoke test passes.
