#!/usr/bin/env node
// Run after normalize.mjs. Compares apps/web/public/data/index.json with the one
// in the last commit and fails if a term lost a big part of its sections.
//
// Usage:
//   node scripts/check-section-drop.mjs
//   TODAY=2026-12-12 node scripts/check-section-drop.mjs    (testing another date)

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MAX_DROP, sectionDrops } from "./lib/section-drop.mjs";
import { todayInNewYork } from "./lib/select-terms.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexFile = "apps/web/public/data/index.json";

async function main() {
  const committed = JSON.parse(
    execFileSync("git", ["show", `HEAD:${indexFile}`], { cwd: root, encoding: "utf8" }),
  );
  const updated = JSON.parse(await readFile(join(root, indexFile), "utf8"));
  const today = process.env.TODAY ?? todayInNewYork();
  const limit = `${MAX_DROP * 100}%`;

  const drops = sectionDrops(committed, updated, today);
  if (drops.length === 0) {
    console.log(`No current or upcoming term lost more than ${limit} of its sections.`);
    return;
  }
  for (const { id, before, after } of drops) {
    console.error(`  ${id}: ${before} sections in the last commit, ${after} now`);
  }
  throw new Error(
    `A term lost more than ${limit} of its sections, which usually means WPI sent a partial file. ` +
      'If the drop is real, run the "Update course data" workflow by hand with allow_drop ticked.',
  );
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
