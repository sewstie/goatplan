// @vitest-environment node
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadSheet, SHEETS } from "./index";
import { validateSheet } from "./validation";

describe("tracking sheet validation", () => {
  it.each(SHEETS)("validates the registered $id sheet", async (metadata) => {
    expect(validateSheet(await loadSheet(metadata.id), metadata)).toEqual([]);
  });

  it("includes every sheet file in the registry", () => {
    const files = readdirSync(new URL(".", import.meta.url)).filter((name) => name.endsWith(".json") && !name.endsWith(".schema.json"));
    expect(files.sort()).toEqual(SHEETS.map((sheet) => `${sheet.id}.json`).sort());
  });

  it("rejects a cross-list missing its other course", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.crossLists[0].pop();
    expect(validateSheet(sheet, SHEETS[0]).join(" ")).toContain("2 items");
  });

  it("rejects missing source metadata", async () => {
    const sheet = { ...await loadSheet("cs-2030"), source: undefined };
    expect(validateSheet(sheet, SHEETS[0]).join(" ")).toContain("source");
  });

  it("does not count overlapping checks toward the unit total again", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.checks.push({ id: "major-count", name: "Major courses", type: "minCourses", section: "cs", minCourses: 5 });
    expect(validateSheet(sheet, SHEETS[0])).toEqual([]);
  });

  it("requires Workday verification before a sheet is checked", async () => {
    expect(validateSheet(await loadSheet("cs-2030"), { ...SHEETS[0], status: "checked" })).toContain("Checked sheets need student verification");
  });

  it("rejects manual confirmations pointing at a missing line", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.manualItems[0].line = 999;
    expect(validateSheet(sheet, SHEETS[0])).toContain("Manual item iqp-1 references an unknown line");
  });

  it("rejects line numbers that differ from the official sheet", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.lines[44].line = 46;
    sheet.sections[7].lines[4] = 46;
    expect(validateSheet(sheet, SHEETS[0])).toContain("Line numbers do not match the official sheet");
  });

  it("rejects malformed course codes in rule data", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.crossLists[0][0] = "cs2022";
    expect(validateSheet(sheet, SHEETS[0]).join(" ")).toContain("pattern");
  });

  it("accepts the registered CS sheet and reports incorrect totals", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    expect(validateSheet(sheet, SHEETS[0])).toEqual([]);
    sheet.totalUnits = 14;
    expect(validateSheet(sheet, SHEETS[0])).toContain("Line units do not match totalUnits");
  });
});
