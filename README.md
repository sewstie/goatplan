# GoatPlan

GoatPlan helps WPI students build a term schedule and plan their degree. It runs
schedule searches and degree audits locally in the browser through a C++ engine
compiled to WebAssembly. Plans and course history are saved in browser storage.

GoatPlan is not affiliated with or endorsed by Worcester Polytechnic Institute.

## What it does

- Search published courses, compare sections and professors, lock sections, and
  find schedules around start-time preferences and blocked times.
- Explain clashes and offer tested changes, including other lecture professors.
- Save plans, open a registration sheet, share a schedule by link, and download
  a calendar file.
- Track Class of 2030 requirements for CS, RBE, ME, ECE and Data Science, with
  course history, AP/IB credit, manual confirmations, pins and a four-year plan.
- Find courses for a specific requirement across all terms, and generate CS
  next-term suggestions that check open seats and schedule fit for published terms.
- Browse recommended-background maps for all five supported majors.

The app supports desktop, tablet and phone layouts, Light and Dark themes, and
Light print output. My degree is available directly at `/degree`. All five
sheets remain marked beta in the registry and have no recorded student Workday
verification. Filling the sheet does not resolve its separate review checks.

## Run locally

Use Node.js 22 and npm. The repository declares Node.js 20 or newer; CI uses 22.
The committed term data and WebAssembly files are enough to run the frontend.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Do not run `create-next-app` inside
this existing checkout. The app uses DM Sans through `next/font/google`; a fresh
production build may need access to Google Fonts.

```bash
npm run lint
npm run test
npm run build
npm exec -w web -- playwright install chromium
npm run test:e2e
```

Playwright builds production itself and starts production on port 4000 and dev
pages on port 3000. Set `PORT` to change both; production uses `PORT + 1000`.

## Repository

| Path | Purpose |
| --- | --- |
| `apps/web/` | Next.js App Router frontend, server routes and browser tests |
| `engine/` | C++20 scheduler, generic degree audit, CLI and WebAssembly build |
| `scripts/` | Course download, normalization, catalog update and data checks |
| `data/catalog.json` | Persistent degree-search catalog |
| `data/fixtures/` | Data samples and worked degree histories |
| `apps/web/public/data/` | Generated term files and term index |
| `apps/web/public/engine/` | Committed WebAssembly runtime |
| `docs/` | Architecture, workflows, contracts and source interpretations |
| `.github/workflows/` | CI and the daily course-data update |

## Other commands

| Command | Purpose |
| --- | --- |
| `npm run engine:test` | Configure, build and test the native engine |
| `npm run engine:wasm` | Rebuild WebAssembly with Emscripten 6.0.12 |
| `npm run engine:wasm:test` | Compare native and WebAssembly responses |
| `npm run data:update` | Fetch WPI listings, normalize terms and update the catalog |
| `npm run data:catalog` | Merge observed offerings into the persistent catalog |
| `npm run data:test` | Run the data-script tests |

Native builds need CMake 3.20+ and a C++20 compiler. Frontend-only work does not
need them. Keep the Emscripten version aligned with CI when rebuilding generated
assets. See [development](docs/development.md) for the macOS build notes.

## Documentation

Start with the [documentation index](docs/README.md). The main guides are
[planner guide](docs/planner.md), [frontend architecture](docs/frontend-architecture.md),
[My degree](docs/degree-tracking-sheet.md),
[recommendations](docs/course-recommendations.md),
[live seats](docs/seats.md), [data format](docs/data-format.md), and
[the engine API](docs/engine-api.md).
