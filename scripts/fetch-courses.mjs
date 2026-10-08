#!/usr/bin/env node
// Downloads WPI's public course-section listing (the same file
// courselistings.wpi.edu loads) and saves it to data/raw/.
//
// Usage:
//   npm run data:fetch
//   COURSES_URL=http://localhost:8000/sample.json npm run data:fetch   (testing)
//
// Be polite: run this occasionally (e.g. once a day during registration),
// never from the browser on every page load.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  process.env.COURSES_URL ?? "https://courselistings.wpi.edu/assets/prod-data.json";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "data", "raw", "courselistings.json");

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GoatPlan course planner (student project)" },
  });
  if (!res.ok) {
    throw new Error(`Request failed: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const sections = data?.Report_Entry;
  if (!Array.isArray(sections)) {
    throw new Error('Unexpected format: no "Report_Entry" array. Did the source change?');
  }

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(
    outFile,
    JSON.stringify({ fetchedAt: new Date().toISOString(), source: SOURCE_URL, ...data }),
  );

  // Quick summary so you can tell at a glance whether the data looks right.
  const byTerm = {};
  const courses = new Set();
  for (const s of sections) {
    const term = s.Offering_Period || "Unknown term";
    byTerm[term] = (byTerm[term] ?? 0) + 1;
    courses.add((s.Course_Title ?? "").split(" - ")[0]);
  }

  console.log(`Saved ${sections.length} sections (${courses.size} courses) to ${relative(root, outFile)}`);
  for (const [term, count] of Object.entries(byTerm).sort()) {
    console.log(`  ${term}: ${count} sections`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
