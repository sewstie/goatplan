import { describe, expect, it } from "vitest";
import { loadSheet, SHEETS } from "./index";
import { fitsLine, onlyOneRivals } from "../rules";
import { validateSheet } from "./validation";

describe("DS Class of 2030", () => {
  it("loads all 45 official requirements as an unverified beta", async () => {
    const sheet = await loadSheet("ds-2030");
    const metadata = SHEETS.find((item) => item.id === sheet.id)!;
    expect(metadata).toMatchObject({ major: "Data Science", status: "beta", verification: null });
    expect(sheet).toMatchObject({ classYear: 2030, catalogYear: "2026-2027", totalUnits: 15,
      source: "https://www.wpi.edu/sites/default/files/2026-06/DS-2030_fillable.pdf",
      catalogSource: "https://wpi.cleancatalog.net/data-science/data-science-major" });
    expect(sheet.lines.map((line) => line.line)).toEqual(Array.from({ length: 45 }, (_, index) => index + 1));
    expect(validateSheet(sheet, metadata)).toEqual([]);
  });
  it("preserves foundation alternatives, advanced electives and official cross-lists", async () => {
    const sheet = await loadSheet("ds-2030");
    for (const [code, line, eligible] of [
      ["CS 1101", 20, true], ["CS 1101", 21, false], ["CS 2119", 21, true],
      ["CS 2022", 20, false], ["CS 4342", 21, true],
      ["MA 1020", 25, true], ["MA 3257", 26, true], ["CS 4032", 26, true],
      ["MA 2072", 24, true], ["OIE 2081", 27, true], ["ETR 3633", 28, true],
      ["CS 3431", 29, false], ["DS 4342", 29, true], ["DS 4433", 29, true],
      ["BCB 4002", 29, true], ["BCB 4004", 29, true], ["DS 4635", 29, true],
      ["CS 3431", 33, true], ["DS 4099", 33, true], ["DS 9999", 33, false],
      ["RE 2731", 40, true], ["ID 2314", 40, true], ["SS 3043", 40, true],
      ["RBE 1001", 41, true], ["DS 1010", 41, false],
    ] as const) expect(fitsLine(code, 3, line, sheet), `${code} on line ${line}`).toBe(eligible);
    expect(onlyOneRivals("MA 1020", sheet)).toEqual(["MA 1021"]);
    expect(onlyOneRivals("MA 1120", sheet)).toEqual(["MA 1022"]);
  });
});
