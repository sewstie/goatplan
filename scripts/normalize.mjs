#!/usr/bin/env node
// Turns data/raw/courselistings.json into one clean file per term in
// apps/web/public/data/. The format is described in docs/data-format.md.
//
// Usage:
//   npm run data:normalize
//   node scripts/normalize.mjs <raw.json> <output dir>     (testing)
//   TODAY=2027-03-06 npm run data:normalize                (testing another date)

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildTerms,
  collectUnparsed,
  unscheduledSections,
  validateTerm,
} from "./lib/build-terms.mjs";
import { formatIndexFile, formatTermFile } from "./lib/format-json.mjs";
import { selectTerms, todayInNewYork } from "./lib/select-terms.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultIn = join(root, "data", "raw", "courselistings.json");
const defaultOut = join(root, "apps", "web", "public", "data");

// Only files named like a term ("2026-B.json") ever get deleted.
const TERM_FILE = /^\d{4}-[A-Z][A-Z0-9]*\.json$/;

const shown = (path) => (relative(root, path).startsWith("..") ? path : relative(root, path));
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function readRaw(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`${shown(path)} not found. Run "npm run data:fetch" first.`);
    }
    throw err;
  }

  const raw = JSON.parse(text);
  if (!Array.isArray(raw?.Report_Entry)) {
    throw new Error('Unexpected format: no "Report_Entry" array. Did the source change?');
  }
  return raw;
}

// A file whose data didn't change keeps its old generatedAt, so a quiet day makes no git diff.
async function writeTermFiles(terms, outDir, generatedAt) {
  await mkdir(outDir, { recursive: true });

  const read = (name) => readFile(join(outDir, name), "utf8").catch(() => null);
  const save = async (name, text, previous) => {
    if (previous !== text) await writeFile(join(outDir, name), text);
    const size = `${Math.round(Buffer.byteLength(text) / 1024)} KB`;
    const what = previous === text ? "unchanged" : "wrote    ";
    console.log(`  ${what} ${shown(join(outDir, name))} (${size})`);
  };

  const index = [];
  for (const { term, courses, status } of terms) {
    const name = `${term.id}.json`;
    const previous = await read(name);
    const oldStamp = /^ {2}"generatedAt": "([^"]+)",$/m.exec(previous ?? "")?.[1];
    const unchanged =
      oldStamp && formatTermFile({ term, generatedAt: oldStamp, courses }) === previous;
    const stamp = unchanged ? oldStamp : generatedAt;

    await save(name, formatTermFile({ term, generatedAt: stamp, courses }), previous);
    index.push({
      ...term,
      status,
      courses: courses.length,
      sections: courses.reduce((n, c) => n + c.sections.length, 0),
      generatedAt: stamp,
    });
  }
  await save("index.json", formatIndexFile({ terms: index }), await read("index.json"));

  const published = new Set(terms.map(({ term }) => `${term.id}.json`));
  for (const name of (await readdir(outDir)).sort()) {
    if (!TERM_FILE.test(name) || published.has(name)) continue;
    await rm(join(outDir, name));
    console.log(`  deleted   ${shown(join(outDir, name))}`);
  }
}

function printSummary({ terms, dropped, report, unparsed, today }) {
  const published = new Set(terms.map(({ term }) => term.id));

  const skipped = Object.entries(report.skipped).map(([reason, n]) => plural(n, `${reason} row`));
  if (skipped.length > 0) console.log(`Skipped ${skipped.join(", ")}`);
  for (const { period, rows, into } of report.placed) {
    const kept = into.filter((id) => published.has(id));
    if (kept.length > 0) {
      console.log(`Placed ${plural(rows, "row")} of "${period}" into ${kept.join(" and ")}`);
    }
  }
  for (const { period, rows } of report.unplaced) {
    console.log(`Left out ${plural(rows, "row")} of "${period}": no lettered term overlaps them`);
  }

  console.log(`Terms (today is ${today} in New York):`);
  for (const { id, reason } of dropped) console.log(`  ${id}  left out: ${reason}`);
  for (const { term, courses, status } of terms) {
    const sections = courses.flatMap((c) => c.sections);
    const options = courses.reduce((n, c) => n + c.options.length, 0);
    const untimed = sections.filter((s) => s.meetings.length === 0).length;
    const largest = courses.reduce((a, b) => (b.options.length > a.options.length ? b : a));
    console.log(
      `  ${term.id}  ${term.name}, ${status}, ${term.start} to ${term.end}: ` +
        `${plural(sections.length, "section")} in ${plural(courses.length, "course")}, ` +
        `${plural(options, "option")} (most: ${largest.code} with ${largest.options.length}), ` +
        `${untimed} with no set time`,
    );
  }

  const droppedOptions = report.droppedOptions
    .filter(({ term }) => published.has(term))
    .sort((a, b) => a.term.localeCompare(b.term) || a.course.localeCompare(b.course));
  console.log(`Overlapping options dropped: ${droppedOptions.length === 0 ? "none" : ""}`);
  for (const { term, course, count } of droppedOptions) {
    console.log(`  ${term} ${course}: dropped ${plural(count, "overlapping option")}`);
  }

  const entries = unparsed.entries();
  console.log(`Values the parsers couldn't read: ${entries.length === 0 ? "none" : entries.length}`);
  for (const { field, value, count, examples } of entries) {
    console.log(`  ${field} ${JSON.stringify(value)} x${count}, e.g. ${examples.join(", ")}`);
  }

  const unscheduled = terms.flatMap((t) => unscheduledSections(t).map((id) => `${t.term.id} ${id}`));
  if (unscheduled.length > 0) {
    console.log(`Sections in no option (WPI doesn't say which lecture they go with):`);
    for (const id of unscheduled) console.log(`  ${id}`);
  }
}

async function main() {
  const [inArg, outArg] = process.argv.slice(2);
  const inFile = inArg ? resolve(inArg) : defaultIn;
  const outDir = outArg ? resolve(outArg) : defaultOut;

  const today = process.env.TODAY ?? todayInNewYork();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error(`TODAY must be a date like 2026-10-11, not "${today}".`);
  }

  const raw = await readRaw(inFile);
  console.log(`Read ${plural(raw.Report_Entry.length, "row")} from ${shown(inFile)}`);

  const unparsed = collectUnparsed();
  const { terms: allTerms, report } = buildTerms(raw.Report_Entry, { onUnparsed: unparsed.add });
  if (allTerms.length === 0) {
    throw new Error('No lettered terms ("2027 Spring C Term") found. Did the source change?');
  }

  const { kept: terms, dropped } = selectTerms(allTerms, today);
  // Don't delete every file over this. WPI normally lists next year before this one ends.
  if (terms.length === 0) {
    throw new Error(`Every term in WPI's data ended before ${today}. Nothing was written.`);
  }
  printSummary({ terms, dropped, report, unparsed, today });

  const problems = terms.reduce((n, term) => n + validateTerm(term), 0);
  if (problems > 0) {
    throw new Error(`Validation found ${plural(problems, "problem")}. Nothing was written.`);
  }

  // Fetch time, not "now", so the same raw file always gives the same output.
  const generatedAt = (raw.fetchedAt ?? new Date().toISOString()).replace(/\.\d+Z$/, "Z");
  console.log("Files:");
  await writeTermFiles(terms, outDir, generatedAt);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
