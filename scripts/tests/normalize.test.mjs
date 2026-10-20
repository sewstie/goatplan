import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";
import { fileURLToPath } from "node:url";

it("prints the number of overlapping options dropped for each course", async () => {
  const sample = JSON.parse(
    await readFile(new URL("../../data/fixtures/sample-sections.json", import.meta.url), "utf8"),
  );
  const rows = sample.Report_Entry.filter((row) => row.Course_Title.startsWith("AE 2320"));
  const lecture = rows.find((row) => row.Instructional_Format === "Lecture");
  const lab = rows.find((row) => row.Course_Section.startsWith("AE 2320-CX01 - "));
  lab.Meeting_Patterns = lecture.Meeting_Patterns;
  lab.Section_Details = lecture.Section_Details;

  const dir = await mkdtemp(join(tmpdir(), "goatplan-normalize-"));
  try {
    const input = join(dir, "raw.json");
    const output = join(dir, "data");
    await writeFile(input, JSON.stringify({ ...sample, Report_Entry: rows }));
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("../normalize.mjs", import.meta.url)), input, output],
      { encoding: "utf8", env: { ...process.env, TODAY: "2027-01-13" } },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /2027-C AE 2320: dropped 1 overlapping option\b/);
    const file = JSON.parse(await readFile(join(output, "2027-C.json"), "utf8"));
    assert.deepEqual(file.courses[0].options, [
      ["AE 2320-CL01", "AE 2320-CX02"],
      ["AE 2320-CL01", "AE 2320-CX03"],
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
