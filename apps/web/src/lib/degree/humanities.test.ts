import { describe, expect, it } from "vitest";
import { applyHuaPath, detectHuaPath, HUA_GROUPINGS, HUA_SUBJECTS, humanitiesCourses, huaPathId, parseHuaPath, type HuaPath } from "./humanities";
import { typedCourse, type HistoryCourse } from "./history";
import { loadSheet, SHEETS } from "./sheets";

const course = (code: string, term?: string, status: "taken" | "planned" = "taken"): HistoryCourse => ({ ...typedCourse(code), status, ...(term ? { term } : {}) });
const codes = (list: HistoryCourse[]) => list.map((item) => item.code);
const DEPTH_BREADTH: HuaPath = { kind: "depth-breadth" };
const language = (subject: string): HuaPath => ({ kind: "language", subject });

describe("humanities path", () => {
  it("orders humanities courses by when they were taken, skipping the seminar and other subjects", () => {
    const list = [course("HI 2310", "B Term 2027"), course("CS 1101", "A Term 2026"), course("SP 1521", "A Term 2026"), course("HU 3900", "D Term 2028"), course("EN 1000"), course("PY 1731", undefined, "planned")];
    expect(codes(humanitiesCourses(list))).toEqual(["EN 1000", "SP 1521", "HI 2310", "PY 1731"]);
  });

  it("puts a student on the language path when their first humanities course is a language", () => {
    expect(detectHuaPath([course("SP 1521", "A Term 2026"), course("CS 1101", "A Term 2026")])).toEqual({ path: language("SP"), chosen: false, first: "SP 1521", alsoPossible: null });
    expect(detectHuaPath([course("GN 1511", "A Term 2026"), course("GN 1512", "B Term 2026")]).path).toEqual(language("GN"));
  });

  it("uses depth and breadth when the first course isn't a language", () => {
    expect(detectHuaPath([course("HI 1310", "A Term 2026")])).toEqual({ path: DEPTH_BREADTH, chosen: false, first: "HI 1310", alsoPossible: null });
  });

  it("switches to depth and breadth once a course breaks the language path", () => {
    expect(detectHuaPath([course("SP 1521", "A Term 2026"), course("HI 1310", "B Term 2026")]).path).toEqual(DEPTH_BREADTH);
    expect(detectHuaPath([course("SP 1521", "A Term 2026"), course("GN 1511", "B Term 2026")]).path).toEqual(DEPTH_BREADTH);
    expect(detectHuaPath([course("SP 1521", "A Term 2026"), course("HU 3900", "B Term 2027", "planned")]).path).toEqual(DEPTH_BREADTH);
  });

  it("keeps ISE open, since it can be its own path or part of depth and breadth", () => {
    expect(detectHuaPath([course("ISE 1800", "A Term 2026")])).toEqual({ path: DEPTH_BREADTH, chosen: false, first: "ISE 1800", alsoPossible: language("ISE") });
  });

  it("uses depth and breadth for Arabic, which has no advanced course to finish a language path", () => {
    expect(detectHuaPath([course("AB 1531", "A Term 2026")]).path).toEqual(DEPTH_BREADTH);
  });

  it("starts on depth and breadth with no humanities courses, and the student's own choice always wins", () => {
    expect(detectHuaPath([])).toEqual({ path: DEPTH_BREADTH, chosen: false, first: null, alsoPossible: null });
    expect(detectHuaPath([course("SP 1521", "A Term 2026")], DEPTH_BREADTH)).toEqual({ path: DEPTH_BREADTH, chosen: true, first: "SP 1521", alsoPossible: null });
    expect(detectHuaPath([course("ISE 1800", "A Term 2026")], language("ISE")).path).toEqual(language("ISE"));
  });

  it("stores a path as text and reads back only paths that exist", () => {
    expect(huaPathId(language("SP"))).toBe("language:SP");
    expect(parseHuaPath("language:SP")).toEqual(language("SP"));
    expect(parseHuaPath("depth-breadth")).toEqual(DEPTH_BREADTH);
    for (const bad of ["language:AB", "language:XX", "language", "", 3, null]) expect(parseHuaPath(bad)).toBeNull();
  });

  it("leaves the sheet alone on depth and breadth", async () => {
    const sheet = await loadSheet("cs-2030");
    expect(applyHuaPath(sheet, DEPTH_BREADTH)).toBe(sheet);
  });

  for (const { id } of SHEETS) {
    it(`turns the ${id} humanities lines into six language lines ending in an advanced course`, async () => {
      const sheet = await loadSheet(id);
      const changed = applyHuaPath(sheet, language("SP"));
      const lines = changed.lines.filter((line) => line.section === "hua");
      expect(lines).toHaveLength(6);
      expect(lines.filter((line) => line.filter.type === "subjects").map((line) => line.filter.subjects)).toEqual(Array(5).fill(["SP"]));
      expect(lines.filter((line) => line.filter.type === "subjectMinLevel").map((line) => [line.filter.subject, line.filter.minLevel, line.name])).toEqual([["SP", 3000, "Advanced language course"]]);
      expect(changed.checks.map((check) => check.type)).not.toContain("groupDepth");
      expect(changed.checks.map((check) => check.type)).not.toContain("groupBreadth");
      expect(changed.checks.map((check) => check.id)).toContain("hua-ap-ib-limit");
      expect(changed.manualItems.map((item) => item.id)).not.toContain("hua-depth-confirmation");
      expect(changed.lines.filter((line) => line.section !== "hua")).toEqual(sheet.lines.filter((line) => line.section !== "hua"));
      expect(sheet.lines.filter((line) => line.section === "hua").map((line) => line.filter.type)).not.toContain("subjectMinLevel");
    });

    it(`${id} uses the shared humanities subjects and groupings`, async () => {
      const sheet = await loadSheet(id);
      const breadth = sheet.checks.find((check) => check.type === "groupBreadth")!;
      expect([...sheet.huaSubjects].sort()).toEqual([...HUA_SUBJECTS].sort());
      expect(breadth.groupings).toEqual(HUA_GROUPINGS);
    });
  }
});
