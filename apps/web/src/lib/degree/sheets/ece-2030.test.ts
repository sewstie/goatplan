import { describe, expect, it } from "vitest";
import { loadSheet, SHEETS } from "./index";
import { validateSheet } from "./validation";
import { fitsLine } from "../rules";

describe("ECE Class of 2030", () => {
  it("loads all 45 official requirements as an unverified beta", async () => {
    const sheet = await loadSheet("ece-2030");
    const metadata = SHEETS.find((item) => item.id === sheet.id)!;
    expect(metadata).toMatchObject({ major: "Electrical and Computer Engineering", status: "beta", verification: null });
    expect(sheet).toMatchObject({ classYear: 2030, catalogYear: "2026-2027", totalUnits: 15,
      source: "https://www.wpi.edu/sites/default/files/2026-07/ECE-2030_fillable.pdf",
      catalogSource: "https://wpi.cleancatalog.net/electrical-and-computer-engineering/electrical-and-computer-engineering-major" });
    expect(sheet.lines.map((line) => line.line)).toEqual(Array.from({ length: 45 }, (_, index) => index + 1));
    expect(validateSheet(sheet, metadata)).toEqual([]);
  });
  it("matches catalog cross-lists while keeping excluded and introductory courses out of engineering", async () => {
    const sheet = await loadSheet("ece-2030");
    for (const [code, line, eligible] of [
      ["BCB 4004", 20, true], ["DS 4635", 20, true],
      ["BCB 1003", 25, true], ["BME 4011", 32, true],
      ["ES 3011", 37, true], ["ECE 2010", 37, true], ["ECE 1799", 37, false],
      ["ECE 2039", 31, true], ["CS 2303", 31, true], ["CS 1004", 31, false],
      ["CS 2011", 31, false], ["CS 2022", 31, false], ["MA 2201", 31, false], ["SS 3043", 31, false],
      ["ME 2300", 44, true], ["FP 3070", 44, true], ["ME 1800", 44, false],
      ["CS 2011", 44, false], ["CS 2022", 44, false], ["SS 3043", 44, false],
    ] as const) expect(fitsLine(code, 3, line, sheet), `${code} on line ${line}`).toBe(eligible);
  });
});
