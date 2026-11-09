# Development

Run JavaScript commands from the repository root unless a command states another
working directory. Root scripts forward web tasks into the `web` npm workspace.

## Setup

Use Node.js 22, which matches CI, and install with `npm ci`. The root package
requires Node.js 20 or newer. The frontend needs neither a native compiler nor
Emscripten when using the committed data and WebAssembly files.

```bash
npm ci
npm run dev
```

The dev server defaults to port 3000. `next/font/google` supplies DM Sans, so a
fresh build can need network access to Google Fonts. Do not scaffold a new Next
app in this repository. Read applicable `AGENTS.md` instructions before editing;
Next.js's local versioned guides are under `node_modules/next/dist/docs/`.

## Checks

```bash
npm run lint
npm run test
npm run build
npm exec -w web -- playwright install chromium
npm run test:e2e
```

`npm run test` runs Vitest, including browser-side engine integration with the
committed WASM. Native-fixture checks can also use a previously built CLI:

```bash
GOATPLAN_NATIVE_CLI="$PWD/engine/build/goatplan_cli" npm run test
```

Pass test arguments to the web workspace directly, with `--` before the
arguments. The root forwarding scripts do not reliably preserve extra npm
options. For example:

```bash
npm run test -w web -- src/lib/degree/lineCourses.test.ts
npm run test:e2e -w web -- seats.spec.ts layout.spec.ts --project=production
npm run test:e2e -w web -- --ignore-snapshots
npm run test:e2e -w web -- layout.spec.ts --project=production --grep 'menu closes' --repeat-each=20
```

For a standalone TypeScript check use `npx tsc --noEmit -p apps/web/tsconfig.json`.
Check patch formatting with `git diff --check`.

Playwright starts a fresh production build and server for normal tests. The
`production` project covers the regular specs; `phone` covers files ending in
`phone.spec.ts` with a touch viewport. `dev-pages` runs the UI and engine dev
pages. E2E data and seat responses are frozen under `apps/web/e2e/fixtures/`;
browser checks should not depend on current WPI listings.

Screenshots go to ignored `apps/web/e2e/screenshots/` or per-test artifacts under
`apps/web/e2e/results/`. Capture desktop at 1440 px, tablet at 834 px and phone at
375 px. Some specs keep committed visual baselines elsewhere in the E2E tree.
Review images before updating a baseline. The original `docs/design` reference
PNGs are absent from this checkout.

The independent major-switching harness is separate:

```bash
npm exec -w web -- playwright test --config playwright.degree-major.config.ts --workers=2
```

It builds an isolated copy with fixture sheets under `.cache/degree-major`.
Those fixture sheets do not belong in the production registry.

## Ports and concurrent work

`PORT` controls the dev server; Playwright production uses `PORT + 1000`.
Use a separate worktree and port when another task is running a server.

```bash
PORT=3002 npm run dev
PORT=3002 npm run test:e2e
```

Set the port in the shell. Playwright reuses a running dev server on that port,
but its production server is always fresh. Do not run competing builds or two
dev servers against the same worktree's `.next` directory.

## Native engine and WebAssembly maintenance

These commands belong to engine maintenance. Follow the repository's frontend
boundaries before changing engine sources or generated assets.

A native build needs CMake 3.20+ and a C++20 compiler. The CMake project downloads
GoogleTest and nlohmann-json when they are not installed locally.

```bash
npm run engine:build
npm run engine:test
```

Use Emscripten 6.0.12 to match CI:

```bash
npm run engine:wasm
npm run engine:wasm:test
```

CI rebuilds WASM and fails if it differs from committed
`apps/web/public/engine/goatplan.mjs` or `goatplan.wasm`. Use the same toolchain
version and inspect generated changes when updating it.

On the development Mac, PATH's `python3` is Xcode Python 3.9.6. Homebrew's
Emscripten 6.0.12 needs Python 3.10+ and obtains it through `EMSDK_PYTHON` in its
wrappers. CMake records the raw `em++`, so `npm run engine:wasm` deliberately uses
`emmake cmake --build`. Keep that wrapper.

To reproduce CI's GCC behavior on that Mac, configure a temporary native build
with Homebrew `g++-16`, `-DCMAKE_CXX_FLAGS=-Werror`,
`-DCMAKE_DISABLE_FIND_PACKAGE_GTest=ON` and
`-DCMAKE_DISABLE_FIND_PACKAGE_nlohmann_json=ON`. Both disables are needed to avoid
mixing Homebrew headers with downloaded GoogleTest libraries.

For an Emscripten upgrade, build a temporary copy with the matching emsdk version
and compare SHA-256 output with Homebrew. Installing emsdk itself also requires
Python 3.10+. The recorded 6.0.12 comparison on October 17, 2026 produced identical
bytes. That record does not verify a later toolchain.

## Course-data maintenance

```bash
npm run data:fetch
npm run data:normalize
npm run data:catalog
npm run data:test
```

`npm run data:update` runs the first three in sequence. Fetching writes the raw
WPI file, normalization produces current/upcoming term files, and catalog update
retains historical courses and observed term letters. These are separate from
runtime live-seat requests.

The scheduled workflow runs daily at 09:00 UTC. Before committing it tests the
scripts and checks for missing terms or a section-count drop above 10%. A manual
workflow run can set `allow_drop` when the drop is intentional. See
[data format](data-format.md) and [live seats](seats.md).

## CI

The workflow in `.github/workflows/ci.yml` runs on pushes to `main` and on pull
requests. It has separate jobs for the native engine, WASM reproducibility and
smoke tests, data tests, web lint/degree-sheet validation/build, and E2E.
CI uses Node.js 22. E2E installs Chromium with OS dependencies and runs with
`--ignore-snapshots` because committed comparisons were recorded on macOS.
Failed E2E artifacts are uploaded for seven days.

The web CI job runs `test:degree-sheets`, not the complete Vitest suite. Run
`npm run test` locally as well. A successful subset of browser tests does not
establish a passing full E2E suite.

## Local environment failures

A sandbox can reject Turbopack's port binding, server startup or Chromium's macOS
launch permissions. A fresh font build can fail when Google Fonts cannot be
resolved. Record those failures separately from test assertions. Do not report
a blocked run as passing, disable focus checks, or remove assertions to work
around infrastructure restrictions. A permitted `next build --webpack` run can
help distinguish a Turbopack problem, but it still needs the same fonts and app
configuration.

## Production runtime

A local production server uses the web workspace's start script:

```bash
npm run build
npm run start -w web
```

Use a host that supports the Next.js runtime and server routes. A static file
host alone does not provide `/api/seats` or its server cache. This repository
contains CI and data-update workflows, not a tracked deployment workflow. A push
to `main` does not by itself establish which hosted version is live.

Plans and degree history remain in each browser's storage, independently of
hosting. JSON history backups are explicit. Optional analytics requires both
`NEXT_PUBLIC_UMAMI_WEBSITE_ID` and a loaded Umami client; setting the variable
alone does not install its script.

## Commits and integration

Follow the existing conventional subjects, such as `feat(degree): ...`,
`fix(shell): ...` and `docs: ...`. Keep commit messages free of coauthor trailers
when requested. The recent history uses feature branches and explicit merge
commits into `main`. Fetch before integrating and push normally; never force a
push to resolve an unexpected remote change.
