#!/usr/bin/env node
// Checks that the WebAssembly engine answers exactly like the native CLI: every
// request in engine/examples/ goes through both, on every published term.
//
// Usage:
//   npm run engine:build && npm run engine:wasm && npm run engine:wasm:test

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "apps", "web", "public", "data");
const examplesDir = join(root, "engine", "examples");
const wasmModule = join(root, "apps", "web", "public", "engine", "goatplan.mjs");
const cli = join(root, "engine", "build", "goatplan_cli");

// elapsedMs changes from run to run, so it's printed instead of compared.
function parse(text) {
  const { elapsedMs, ...response } = JSON.parse(text);
  return { response, elapsedMs };
}

function times(wasm, native) {
  if (wasm.elapsedMs === undefined) return `error ${wasm.response.error?.code}`;
  return `wasm ${wasm.elapsedMs} ms, native ${native.elapsedMs} ms`;
}

const differingFields = (a, b) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => !isDeepStrictEqual(a[key], b[key]));

async function main() {
  for (const [path, script] of [[wasmModule, "engine:wasm"], [cli, "engine:build"]]) {
    if (!existsSync(path)) throw new Error(`${relative(root, path)} is missing. Run "npm run ${script}" first.`);
  }
  const { default: createGoatplan } = await import(pathToFileURL(wasmModule).href);
  const engine = await createGoatplan();

  const { terms } = JSON.parse(await readFile(join(dataDir, "index.json"), "utf8"));
  const examples = (await readdir(examplesDir)).filter((name) => name.endsWith(".json")).sort();
  const width = Math.max(...examples.map((name) => name.length));

  let compared = 0;
  let different = 0;
  for (const { id } of terms) {
    const termFile = join(dataDir, `${id}.json`);
    const loaded = JSON.parse(engine.loadTerm(await readFile(termFile, "utf8")));
    if (!loaded.ok || loaded.termId !== id) {
      throw new Error(`loadTerm didn't load ${id}: ${JSON.stringify(loaded)}`);
    }

    for (const name of examples) {
      const requestFile = join(examplesDir, name);
      const wasm = parse(engine.handle(await readFile(requestFile, "utf8")));
      const run = spawnSync(cli, [termFile, requestFile], { encoding: "utf8" });
      if (!run.stdout) {
        throw new Error(`goatplan_cli gave no answer for ${id} ${name}: ${run.error?.message ?? run.stderr}`);
      }
      const native = parse(run.stdout);

      compared += 1;
      const fields = differingFields(wasm.response, native.response);
      if (fields.length > 0) different += 1;
      const verdict = fields.length === 0 ? "identical" : `different (${fields.join(", ")})`;
      console.log(`${id}  ${name.padEnd(width)}  ${verdict}  ${times(wasm, native)}`);
    }
  }

  if (different > 0) {
    console.error(`${different} of ${compared} answers differ between WebAssembly and native.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${compared} answers are identical.`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
