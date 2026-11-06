import { describe, expect, it } from "vitest";
import { loadSheet, SHEETS } from "./index";
import { validateSheet } from "./validation";
import { fitsLine } from "../rules";

describe("ME Class of 2030", () => {
  it("reserves one science slot for chemistry and another for physics", async () => {
    const sheet = await loadSheet("me-2030");
    expect(fitsLine("PH 1110", 3, 22, sheet)).toBe(false);
    expect(fitsLine("CH 1010", 3, 22, sheet)).toBe(true);
    expect(fitsLine("CH 1010", 3, 23, sheet)).toBe(false);
    expect(fitsLine("PH 1110", 3, 23, sheet)).toBe(true);
    expect(fitsLine("CH 1020", 3, 24, sheet)).toBe(true);
    expect(fitsLine("PH 1120", 3, 24, sheet)).toBe(true);
  });
  it("loads all 45 official numbered requirements as an unverified beta", async () => {
    const sheet = await loadSheet("me-2030");
    const metadata = SHEETS.find((item) => item.id === sheet.id)!;
    expect(metadata).toMatchObject({ major: "Mechanical Engineering", status: "beta", verification: null });
    expect(sheet).toMatchObject({ classYear: 2030, catalogYear: "2026-2027", totalUnits: 15,
      source: "https://www.wpi.edu/sites/default/files/2026-06/ME-2030_fillable.pdf",
      catalogSource: "https://wpi.cleancatalog.net/mechanical-and-materials-engineering/mechanical-engineering-major" });
    expect(sheet.lines.map((line) => line.line)).toEqual(Array.from({ length: 45 }, (_, index) => index + 1));
    expect(validateSheet(sheet, metadata)).toEqual([]);
  });
});
