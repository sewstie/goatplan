import { describe, expect, it } from "vitest";
import { SHEETS } from "@/lib/degree/sheets";
import { AREA_NAMES } from "./csLayout";
import { buildCourseMap } from "./courseMap";
import { buildFlowchart, chainOf } from "./flowchart";
import { getCourseMap } from "./maps";
import { routeFlowchart, type Box, type Point } from "./routing";

function crosses([a, b]: [Point, Point], box: Box) {
  return Math.min(a[0], b[0]) < box.x + box.w - 1 && Math.max(a[0], b[0]) > box.x + 1
    && Math.min(a[1], b[1]) < box.y + box.h - 1 && Math.max(a[1], b[1]) > box.y + 1;
}

describe("maps for every registered major", () => {
  for (const sheet of SHEETS) {
    it(`${sheet.abbreviation} has unique courses, catalog sources and a routable map`, () => {
      const definition = getCourseMap(sheet.id)!;
      expect(definition).not.toBeNull();
      const flow = buildFlowchart(definition.records, definition.layout);
      const layout = routeFlowchart(flow);
      expect(new Set(definition.records.map((record) => record.code)).size).toBe(definition.records.length);
      expect(new Set(flow.courses.map((course) => course.code)).size).toBe(flow.courses.length);
      expect(layout.bands.map((band) => band.band)).toEqual([1000, 2000, 3000, 4000]);
      for (const record of definition.records) {
        expect(record.source).toMatch(/^https:\/\/wpi\.cleancatalog\.net\//);
        expect(record.title.length).toBeGreaterThan(0);
        expect(record.wording.length).toBeGreaterThan(0);
      }
      for (const course of flow.courses) if (course.area) expect(AREA_NAMES[course.area]).toBeTruthy();
      for (const edge of layout.edges) {
        for (let i = 1; i < edge.points.length; i++) {
          const segment: [Point, Point] = [edge.points[i - 1], edge.points[i]];
          for (const [code, box] of Object.entries({ ...layout.boxes, ...layout.badges })) {
            expect(crosses(segment, box), `${edge.from} → ${edge.to} crosses ${code}`).toBe(false);
          }
        }
      }
    });
  }

  it("includes engineering science in the ME chains without repeating it as outside background", () => {
    const definition = getCourseMap("me-2030")!;
    const flow = buildFlowchart(definition.records, definition.layout);
    expect(flow.courses).toHaveLength(41);
    expect(flow.hidden).toEqual([]);
    expect(chainOf(flow, "ES 2501").after).toContain("ME 4320");
    expect(chainOf(flow, "ES 3004").after).toContain("ME 4430");
    expect(flow.courses.find((course) => course.code === "ME 2300")?.extras).toEqual([]);
    expect(flow.courses.find((course) => course.code === "ME 4322")?.aliases).toContain("RBE 4322");
    expect(flow.edges.filter((edge) => edge.to === "ME 4512")).toEqual([]);
    expect(definition.records.find((record) => record.code === "ME 4512")?.wording).toContain("both ES 2501 and ES 2502 or both CE 2000 and CE 2001");
  });

  it("keeps ECE threshold and concurrent background explicit", () => {
    const definition = getCourseMap("ece-2030")!;
    const flow = buildFlowchart(definition.records, definition.layout);
    expect(flow.courses).toHaveLength(34);
    expect(flow.hidden).toEqual([]);
    expect(chainOf(flow, "ECE 2049").after).toContain("ECE 4801");
    expect(flow.edges.filter((edge) => edge.to === "ECE 2799")).toEqual([]);
    expect(definition.records.find((record) => record.code === "ECE 2799")?.background).toEqual({ note: "At least three of ECE 2019, ECE 2029, ECE 2049 and ECE 2311" });
    expect(definition.records.find((record) => record.code === "ECE 2019")?.wording).toContain("concurrently");
  });

  it("connects DS to its computing and statistics foundations and preserves cross-list aliases", () => {
    const definition = getCourseMap("ds-2030")!;
    const flow = buildFlowchart(definition.records, definition.layout);
    expect(flow.courses).toHaveLength(27);
    expect(flow.hidden).toEqual([]);
    expect(chainOf(flow, "MA 2611").after).toContain("DS 3010");
    expect(chainOf(flow, "CS 3431").after).toContain("DS 4433");
    expect(chainOf(flow, "CS 4342").after).toContain("DS 4343");
    expect(flow.courses.find((course) => course.code === "DS 4344")?.extras).toEqual([]);
    expect(flow.courses.find((course) => course.code === "DS 4343")?.aliases).toContain("CS 4343");
    const map = buildCourseMap([], definition.records);
    expect(map.nodes.find((node) => node.code === "DS 4635")?.aliases).toContain("MA 4635");
  });
});
