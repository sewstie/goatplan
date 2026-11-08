import { describe, expect, it } from "vitest";
import { buildCourseMap, courseCodes } from "./courseMap";
import { buildFlowchart, chainOf } from "./flowchart";
import { getCourseMap } from "./maps";
import { routeFlowchart } from "./routing";

const definition = getCourseMap("rbe-2030")!;
const flow = buildFlowchart(definition.records, definition.layout);

describe("RBE course map", () => {
  it("places every RBE catalog course and routes its background without upward arrows", () => {
    expect(flow.courses).toHaveLength(13);
    expect(flow.hidden).toEqual([]);
    const routed = routeFlowchart(flow);
    expect(routed.edges).toHaveLength(flow.edges.length);
    for (const edge of flow.edges) {
      expect(routed.boxes[edge.from].y).toBeLessThan(routed.boxes[edge.to].y);
    }
  });

  it("follows manipulation through navigation to vision without inventing a unified robotics sequence", () => {
    expect(chainOf(flow, "RBE 3001").before).toContain("RBE 2002");
    expect(chainOf(flow, "RBE 3001").after).toEqual(new Set(["RBE 3002", "RBE 4540", "RBE 4815"]));
    expect(chainOf(flow, "RBE 2001").after.size).toBe(0);
    expect(flow.links).not.toContainEqual(expect.objectContaining({ from: "RBE 2020", to: "RBE 2002" }));
  });

  it("keeps supporting subjects on cards and recognizes cross-listed history", () => {
    const manipulation = flow.courses.find((course) => course.code === "RBE 3001")!;
    expect(manipulation.extras).toEqual(["ECE 2049", "CS 2102", "MA 2051", "MA 2071"]);
    expect(manipulation.extras).not.toContain("RBE 2002");
    expect(flow.courses.find((course) => course.code === "RBE 4322")?.aliases).toEqual(["ME 4322"]);
    const nodes = buildCourseMap([], definition.records).nodes;
    expect(nodes.find((node) => node.code === "RBE 3001")?.wording).toContain("BE 2002");
    expect(nodes.find((node) => node.code === "ECE 2049")?.backgroundCurated).toBe(false);
  });

  it("keeps probability alternatives and programming experience in the background", () => {
    const background = definition.records.find((course) => course.code === "RBE 2020")!.background;
    expect(courseCodes(background)).toContain("CS 2119");
    const navigation = definition.records.find((course) => course.code === "RBE 3002")!.background;
    expect(navigation).toEqual({ all: [{ course: "RBE 3001" }, { course: "ES 3011" }, { any: [{ course: "MA 2621" }, { course: "MA 2631" }] }] });
  });

  it("enables only majors with their own map and leaves CS independent", () => {
    expect(getCourseMap(null)).toBeNull();
    expect(getCourseMap("unknown-2030")).toBeNull();
    const cs = getCourseMap("cs-2030")!;
    expect(buildFlowchart(cs.records, cs.layout).courses).toHaveLength(49);
    expect(flow.courses.every((course) => course.code.startsWith("RBE "))).toBe(true);
  });
});
