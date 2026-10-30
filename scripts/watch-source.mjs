#!/usr/bin/env node
// One check of WPI's file for the one-week freshness measurement. Writes to watch/, never commits.
//
// Usage:
//   node scripts/watch-source.mjs
//   COURSES_URL=http://localhost:8000/sample.json node scripts/watch-source.mjs   (testing)

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SOURCE_URL, checkSource } from "./lib/watch-source.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const watchDir = join(root, "watch");
const stateFile = join(watchDir, "state.json");
const logFile = join(watchDir, "log.jsonl");

async function readState() {
  try {
    return JSON.parse(await readFile(stateFile, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

const { entry, state } = await checkSource(await readState(), {
  fetch,
  url: process.env.COURSES_URL ?? SOURCE_URL,
});

await mkdir(watchDir, { recursive: true });
await appendFile(logFile, `${JSON.stringify(entry)}\n`);
if (state) await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);
console.log(JSON.stringify(entry));
