import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function mergeCatalog(previous, seed, terms) {
  const courses = new Map(previous.map((course) => [course.code, { ...course, termLetters: [...(course.termLetters ?? [])] }]));
  for (const course of seed) if (!courses.has(course.code)) courses.set(course.code, { ...course, offeredThisYear: false, termLetters: [] });
  for (const { term, courses: offered } of [...terms].sort((a, b) => a.term.start.localeCompare(b.term.start))) {
    const letter = term.id.slice(-1);
    const thisYear = /^(2026-[AB]|2027-[CDE])$/.test(term.id);
    for (const { code, title, credits, level } of offered) {
      const old = courses.get(code);
      courses.set(code, {
        code, title, credits, level,
        offeredThisYear: thisYear || old?.offeredThisYear === true,
        termLetters: [...new Set([...(old?.termLetters ?? []), letter])].sort(),
      });
    }
  }
  return [...courses.values()].sort((a, b) => a.code.localeCompare(b.code));
}

async function main() {
  const termDir = resolve(process.argv[2] ?? "apps/web/public/data");
  const out = resolve("data/catalog.json");
  const seed = JSON.parse(await readFile(resolve("data/wpi-catalog-2026-27.json"), "utf8"));
  let previous = [];
  try { previous = JSON.parse(await readFile(out, "utf8")).courses; }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const files = (await readdir(termDir)).filter((name) => /^\d{4}-[A-Z]\.json$/.test(name));
  const terms = await Promise.all(files.map(async (name) => JSON.parse(await readFile(resolve(termDir, name), "utf8"))));
  const catalog = { academicYear: "2026–27", source: seed.source, courses: mergeCatalog(previous, seed.courses, terms) };
  await writeFile(out, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Degree catalog: ${catalog.courses.length} courses`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
