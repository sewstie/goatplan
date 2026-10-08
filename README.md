# GoatPlan 🐐

A course planner for WPI students: pick your courses for a term, compare sections and professors, and build a conflict-free schedule.

> Not affiliated with or endorsed by Worcester Polytechnic Institute.

## Project structure

```
goatplan/
├── apps/web/           Next.js app (TypeScript, Tailwind): the UI
├── engine/             C++ scheduling engine (compiled to WebAssembly later)
│   ├── include/        public headers
│   ├── src/            engine code + a small command-line tool
│   └── tests/          GoogleTest unit tests
├── scripts/            data scripts (plain JavaScript, no dependencies)
├── data/
│   ├── raw/            downloaded WPI data (git-ignored, re-fetchable)
│   └── fixtures/       small real samples used for tests
└── .github/workflows/  CI: engine tests + web lint/build on every push
```

## Requirements

- **Node.js 20+** (22 recommended) and npm
- **CMake 3.20+** and a **C++20 compiler** (GCC 11+, Clang 14+, or Xcode command line tools)
- Later, for WebAssembly: [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)

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

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the web app at http://localhost:3000                |
| `npm run build`        | Production build of the web app                           |
| `npm run lint`         | Lint the web app                                          |
| `npm run engine:build` | Build the C++ engine and CLI                              |
| `npm run engine:test`  | Build the engine and run the unit tests                   |
| `npm run data:fetch`   | Download the latest WPI section data into `data/raw/`     |

Try the engine on its own: `./engine/build/goatplan_cli`

## Data

Course and section data comes from WPI's public course listings
(`https://courselistings.wpi.edu/assets/prod-data.json`). Fetch it occasionally
from the script, not from the browser on every page load. Professor ratings are
not included in that data; the app links out to Rate My Professors.
