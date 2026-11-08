import { describe, expect, it } from "vitest";
import { buildCourseMap } from "@/lib/courseMap/courseMap";
import { getCourseMap } from "@/lib/courseMap/maps";
import { createDegreeSource } from "@/lib/degree/degreeSource";
import { HISTORY_KEY, typedCourse } from "@/lib/degree/history";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { planMapCourse } from "./planMapCourse";

const node = buildCourseMap([], getCourseMap("rbe-2030")!.records).nodes.find((node) => node.code === "RBE 4322")!;

describe("planning from the course map", () => {
  for (const code of ["ME 4322", "RBE 4322"]) {
    it(`changes the saved ${code} term without adding another course`, () => {
      const storage = new MemoryPlanStorage();
      storage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, sheetId: "rbe-2030", courses: [{ ...typedCourse(code), status: "planned", term: "A Term 2027" }], manual: [] }));
      const source = createDegreeSource({ getStorage: () => storage, engine: { audit: async () => { throw new Error("Not used"); } } });
      expect(planMapCourse(source, node, "B Term 2027")).toBe("saved");
      expect(source.getSnapshot().history.courses).toEqual([expect.objectContaining({ code, status: "planned", term: "B Term 2027" })]);
      expect(JSON.parse(storage.getItem(HISTORY_KEY)!).courses).toHaveLength(1);
    });
  }

  it("adds a course with its catalog title when it is absent from history", () => {
    const storage = new MemoryPlanStorage();
    const source = createDegreeSource({ getStorage: () => storage, engine: { audit: async () => { throw new Error("Not used"); } } });
    expect(planMapCourse(source, node, "B Term 2027")).toBe("added");
    expect(source.getSnapshot().history.courses).toEqual([expect.objectContaining({ code: "RBE 4322", title: node.title, status: "planned", term: "B Term 2027" })]);
  });
});
