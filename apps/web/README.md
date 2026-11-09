# GoatPlan web app

The frontend uses Next.js App Router, strict TypeScript, React, Tailwind CSS,
Zustand and DM Sans. It belongs to the root npm workspace; install dependencies
with `npm ci` at the repository root.

## Local commands

From the repository root:

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run test:e2e
```

From this directory, the same script names work. Install the browser once with
`npx playwright install chromium`. Playwright starts a fresh production build
on `PORT + 1000` and starts or reuses the dev server on `PORT` (default 3000).
Only one dev server should use a worktree's `.next` output.

## Routes and data

| Route | Purpose |
| --- | --- |
| `/` | Schedule planner, including shared-link and saved-plan views |
| `/plans` | Saved plans and their registration sheets |
| `/degree` | Major selection, tracking sheet, four-year plan and course maps |
| `/data/catalog.json` | Persistent catalog served from the root `data/` directory |
| `/api/seats?term=2027-C` | Cached live seat snapshot for a published term |
| `/dev/ui`, `/dev/engine` | Development pages; return 404 in production |

The UI reads normalized term JSON and uses `lib/engine/EngineClient` for schedule
searches and audits. The scheduler runs in a worker. Search, section presentation,
saved plans, sharing and registration sheets stay in TypeScript.

Working drafts, saved plans, degree history and theme choice use separate browser
storage keys. There is no account or server-side plan database. `/api/seats` is
the runtime server boundary for refreshing WPI seat counts. Feedback opens GitHub
Issues. Optional analytics sends named events only when configured and loaded.

## More documentation

- [Architecture](../../docs/frontend-architecture.md)
- [Development and CI](../../docs/development.md)
- [Degree tracking](../../docs/degree-tracking-sheet.md)
- [Documentation index](../../docs/README.md)
