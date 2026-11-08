import { describe, expect, it } from "vitest";
import { loadSheet } from "./sheets";
import { crossListed, fitsLine, onlyOneRivals } from "./rules";

describe("fitsLine", () => {
  it("uses the supplied sheet's filter without inheriting CS exclusions", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.lines[15].filter = { type: "subjectMinLevel", subject: "CS", minLevel: 2000 };
    expect(fitsLine("CS 2119", 3, 16, sheet)).toBe(true);
  });

  it("lets CS 2022 on CS and math lines through its cross-listing", () => {
    expect(fitsLine("CS 2022", 3, 18)).toBe(true);
    expect(fitsLine("CS 2022", 3, 38)).toBe(true);
    expect(fitsLine("MA 2201", 3, 18)).toBe(true);
    expect(fitsLine("CS 2022", 3, 40)).toBe(false);
  });

  it("keeps CS 2119 off CS lines but allows a free elective", () => {
    expect(fitsLine("CS 2119", 3, 18)).toBe(false);
    expect(fitsLine("CS 2119", 3, 13)).toBe(true);
  });

  it("treats a three-digit course as graduate level", () => {
    expect(fitsLine("CS 502", 3, 26)).toBe(true);
    expect(fitsLine("CS 3013", 3, 26)).toBe(false);
    expect(fitsLine("CS 5007", 3, 26)).toBe(false);
  });

  it("knows the intro line takes CS 1101 and CS 2000+", () => {
    expect(fitsLine("CS 1101", 3, 16)).toBe(true);
    expect(fitsLine("CS 1101", 3, 17)).toBe(false);
    expect(fitsLine("CS 2102", 3, 16)).toBe(true);
  });

  it("needs a full course except on free electives", () => {
    expect(fitsLine("CS 2102", 1.5, 17)).toBe(false);
    expect(fitsLine("CS 2102", 1.5, 13)).toBe(true);
  });

  it("takes nothing on project and WPE lines", () => {
    expect(fitsLine("CS 2102", 3, 10)).toBe(false);
    expect(fitsLine("CS 2102", 3, 31)).toBe(false);
    expect(fitsLine("PE 1001", 3, 7)).toBe(false);
  });

  it("follows the science elective exclusions", () => {
    expect(fitsLine("ME 1800", 3, 44)).toBe(true);
    expect(fitsLine("RBE 3100", 3, 44)).toBe(false);
    expect(fitsLine("ME 1800", 3, 41)).toBe(false);
  });
});

describe("course relations", () => {
  it("finds both codes of a cross-listing", () => {
    expect(crossListed("MA 2201")).toEqual(["CS 2022", "MA 2201"]);
    expect(crossListed("CS 1101")).toEqual(["CS 1101"]);
  });

  it("finds the rest of an only-one-of set", () => {
    expect(onlyOneRivals("CS 2102")).toEqual(["CS 210X", "CS 2103"]);
    expect(onlyOneRivals("CS 3013")).toEqual([]);
  });
});
