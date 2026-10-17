# GoatPlan 🐐

A course planner for WPI students: pick your courses for a term, compare sections and professors, and build a conflict-free schedule.

> Not affiliated with or endorsed by Worcester Polytechnic Institute.

## Project structure

```
goatplan/
├── apps/web/           Next.js app (TypeScript, Tailwind): the UI
├── engine/             C++ scheduling engine, native and WebAssembly (see engine/README.md)
│   ├── include/        public headers
│   ├── src/            engine code + a small command-line tool
│   └── tests/          GoogleTest unit tests
├── scripts/            data scripts (plain JavaScript, no dependencies)
├── data/
│   ├── raw/            downloaded WPI data (git-ignored, re-fetchable)
│   └── fixtures/       small real samples used for tests
└── .github/workflows/  CI on every push (engine, WebAssembly, data scripts, web) and the daily data update
```

## Requirements

- **Node.js 20+** (22 recommended) and npm
- **CMake 3.20+** and a **C++20 compiler** (GCC 11+, Clang 14+, or Xcode command line tools)
- For the WebAssembly build: [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) 6.0.12, the version CI uses (`brew install emscripten` on a Mac)

## First-time setup

```bash
# 1. Create the web app (only once)
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --use-npm --disable-git --skip-install --yes

# 2. Install all JavaScript packages from the repo root (npm workspaces)
npm install

# 3. Build the engine and run its tests
npm run engine:test
```

## Everyday commands

| Command                    | What it does                                               |
| -------------------------- | ---------------------------------------------------------- |
| `npm run dev`              | Start the web app at http://localhost:3000                 |
| `npm run build`            | Production build of the web app                            |
| `npm run lint`             | Lint the web app                                           |
| `npm run engine:build`     | Build the C++ engine and CLI                               |
| `npm run engine:test`      | Build the engine and run the unit tests                    |
| `npm run engine:wasm`      | Build the WebAssembly engine (needs Emscripten)            |
| `npm run engine:wasm:test` | Check the WebAssembly engine answers like the CLI          |
| `npm run data:fetch`       | Download the latest WPI section data into `data/raw/`      |
| `npm run data:normalize`   | Turn that download into `apps/web/public/data/<term>.json` |
| `npm run data:update`      | Fetch, then normalize                                      |
| `npm run data:test`        | Run the unit tests of the data scripts                     |

Try the engine on its own: `./engine/build/goatplan_cli apps/web/public/data/2026-B.json engine/examples/basic.json --text`. Leave out `--text` to get the raw JSON response, or pass `-` instead of a file to read the request from stdin. The request and response format is in [docs/engine-api.md](docs/engine-api.md).

## Data

Course and section data comes from WPI's public course listings
(`https://courselistings.wpi.edu/assets/prod-data.json`). Fetch it occasionally
from the script, not from the browser on every page load. Professor ratings are
not included in that data; the app links out to Rate My Professors.

`scripts/normalize.mjs` turns the download into one clean JSON file per term.
The format is described in [docs/data-format.md](docs/data-format.md).
