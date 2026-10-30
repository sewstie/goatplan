#!/usr/bin/env node
// Prints a Markdown summary of watch/log.jsonl.
//
// Usage:
//   node scripts/watch-report.mjs
//   node scripts/watch-report.mjs path/to/log.jsonl

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatReport, parseLog, summarize } from "./lib/watch-report.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logFile = process.argv[2] ?? join(root, "watch", "log.jsonl");

let text = "";
try {
  text = await readFile(logFile, "utf8");
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}
const entries = parseLog(text);
process.stdout.write(formatReport(summarize(entries), entries));
