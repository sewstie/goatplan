import { describe, expect, it } from "vitest";
import { expandCoursePattern, expandSheetPatterns } from "./coursePatterns";
import { loadSheet } from "./index";

describe("course number patterns", () => {
  it("matches the whole course code and preserves number ranges", () => {
    const courses = expandCoursePattern("BB [34][0-79][0-9]{2}");
    expect(courses).toEqual(
      expect.arrayContaining(["BB 3010", "BB 4001", "BB 4900"]),
    );
    for (const code of [
      "BB 2801",
      "BB 3815",
      "BB 4801",
      "BB 500",
      "BB 13010",
      "BCB 4001",
    ]) {
      expect(courses).not.toContain(code);
    }
  });

  it("supports graduate courses and term-length course numbers", () => {
    expect(expandCoursePattern("CH 5[0-9]{2}[AB]?")).toEqual(
      expect.arrayContaining(["CH 501", "CH 501A", "CH 501B"]),
    );
    expect(expandCoursePattern("CH 5[0-9]{2}[AB]?")).not.toContain("CH 501C");
  });

  it("rejects patterns without a subject or any valid course codes", () => {
    expect(() => expandCoursePattern(".*")).toThrow("Invalid course pattern");
    expect(() => expandCoursePattern("BB impossible")).toThrow(
      "Empty course pattern",
    );
  });

  it("combines explicit choices and patterns without changing exclusions or the source", async () => {
    const sheet = structuredClone(await loadSheet("cs-2030"));
    sheet.lines[15].filter = {
      type: "courses",
      courses: ["BB 1101"],
      coursePatterns: ["BB 11[0-9]{2}"],
      excludedCourses: ["BB 1102"],
    };
    const expanded = expandSheetPatterns(sheet);
    expect(
      expanded.lines[15].filter.courses?.filter((code) => code === "BB 1101"),
    ).toHaveLength(1);
    expect(expanded.lines[15].filter.excludedCourses).toEqual(["BB 1102"]);
    expect(expanded.lines[15].filter.coursePatterns).toBeUndefined();
    expect(sheet.lines[15].filter.coursePatterns).toEqual(["BB 11[0-9]{2}"]);
  });
});
