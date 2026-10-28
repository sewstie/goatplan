# Engine

The C++ scheduling engine. Give it a term file and a list of courses, and it
finds every schedule that fits, ranks them and sends back the best ones. It can
rank by one measure first (latest start, earliest finish, fewest days, least
free time between classes, fewest early classes) or by an overall score, and
it can limit a course to some of its sections, for example one professor's.
When nothing fits, it says why and what to change. The same code runs natively, as
a command-line tool and in the tests, and in the browser as WebAssembly.

The request and response format is in [docs/engine-api.md](../docs/engine-api.md),
and the term files it reads are described in [docs/data-format.md](../docs/data-format.md).

```
engine/
├── include/goatplan/   headers; engine.hpp is the way in
├── src/                the engine, main.cpp (command-line tool), wasm_bindings.cpp (browser)
├── tests/              GoogleTest tests; golden/ holds saved responses
└── examples/           sample requests (basic, preferences, impossible, any-of,
                        professor-start, sort-primary)
```

## Native build

```bash
npm run engine:build    # engine, command-line tool and tests, in engine/build/
npm run engine:test     # build, then run the tests
./engine/build/goatplan_cli apps/web/public/data/2026-B.json engine/examples/basic.json --text
./engine/build/goatplan_cli apps/web/public/data/2026-B.json engine/examples/sort-primary.json --text
```

The tool takes a term file and a request file, or `-` to read the request from
stdin. `--text` prints a readable summary instead of JSON.

One test compares two full responses with the files in `tests/golden/`. If a
change is meant to alter responses, rewrite those files with
`GOATPLAN_UPDATE_GOLDEN=1 ctest --test-dir engine/build` and read the diff
before committing.

## WebAssembly build

You need Emscripten 6.0.12, the version CI uses. On a Mac it's
`brew install emscripten`. The build step goes through `emmake` because
Homebrew's Emscripten finds its own Python only through its wrapper scripts,
and the Python 3.9 that comes with macOS is too old for it.

```bash
npm run engine:wasm         # writes apps/web/public/engine/goatplan.mjs and goatplan.wasm
npm run engine:wasm:test    # needs engine:build too
```

The two built files are committed, because the host that serves the site has
no Emscripten. After changing engine code, run `npm run engine:wasm` and commit
the output. CI rebuilds them with Emscripten 6.0.12 and fails if they differ by
even a byte, so a stale build can't be deployed. If you upgrade Emscripten,
change the version in `ci.yml` in the same commit.

`engine:wasm:test` sends every request in `examples/` through the WebAssembly
module and through the native command-line tool, on every published term, and
fails if any answer differs. Only `elapsedMs` is left out of the comparison,
since it changes from run to run.

The module runs in a Web Worker or in Node, not on the page's main thread, so a
long search can't freeze the page. It holds one engine, so one term at a time:

```js
const engine = await createGoatplan();   // the default export of goatplan.mjs
engine.loadTerm(termText);               // '{"ok":true,"version":1,"termId":"2026-B","courses":589}'
engine.handle(requestText);              // the response described in docs/engine-api.md
```

Both functions take and return JSON text, and neither one throws.

## How a request is answered

1. `filters.cpp` drops the options that break the preferences (locked
   sections, `anyOf` sections such as one professor's, full sections, too
   early, blocked times) and counts why.
2. `groups.cpp` puts a course's options that meet at exactly the same times
   into one group, so the search sees each weekly pattern once.
3. `solver.cpp` goes course by course, the one with the fewest groups first,
   skips anything that overlaps, and keeps the best `maxSchedules` in a heap.
   `score.cpp` measures each schedule (early, late and free minutes, days,
   first start, last end) and compares two schedules: by `sort.primary`
   first when the request sets it, then by the overall score, then by section
   order. The heap and the final list use the same comparison, so the first
   schedule is the best of everything the search checked, not only of the
   ones returned. See [Order of schedules](../docs/engine-api.md#order-of-schedules).
4. When nothing fits, `diagnose.cpp` works out why and tries the usual fixes:
   an earlier start time, clearing blocked times, allowing full
   sections, unlocking a course, allowing any of a course's sections
   (`clearAnyOf`), or dropping a course.

`week_mask.cpp` stores a week as 5-minute slots in 35 64-bit words, five per
day, so checking two options for a clash takes at most 35 AND operations.
`engine.cpp` reads the request, runs the steps above and writes the response,
and `json_io.cpp` reads term files.
