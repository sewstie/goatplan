import { describe, expect, it } from "vitest";
import { buildCourseMap } from "./courseMap";
import type { Course } from "@/lib/data/types";

describe("CS course background map", () => {
  it("keeps the algorithms alternatives together with the discrete mathematics background", () => {
    const map = buildCourseMap([]);
    const algorithms = map.nodes.find((node) => node.code === "CS 2223")!;
    expect(algorithms.background).toEqual({ all: [{ any: [{ course: "CS 2102" }, { course: "CS 2103" }] }, { course: "CS 2022" }] });
    expect(algorithms.wording).toBe("CS 2102 or CS 2103, and CS 2022.");
    expect(algorithms.source).toBe("https://wpi.cleancatalog.net/computer-science/cs-2223");
    expect(map.connections.filter((edge) => edge.to === "CS 2223").map((edge) => edge.from)).toEqual(["CS 2102", "CS 2103", "CS 2022"]);
  });

  it("preserves experience alternatives without inventing arrows from unrelated mentions", () => {
    const map = buildCourseMap([]);
    expect(map.nodes.find((node) => node.code === "CS 2011")?.background).toEqual({ any: [{ course: "CS 2301" }, { course: "CS 2303" }, { note: "a significant knowledge of C/C++" }] });
    expect(map.nodes.find((node) => node.code === "CS 2011")?.wording).toBe("CS 2301 or CS 2303, or a significant knowledge of C/C++.");
    expect(map.connections.some((edge) => edge.from === "CS 2303" && edge.to === "CS 2011")).toBe(true);
    expect(map.connections.filter((edge) => edge.to === "CS 1101")).toEqual([]);
    expect(map.nodes.find((node) => node.code === "CS 4342")?.background).toEqual({ all: [
      { any: [{ course: "MA 1024" }, { course: "MA 1034" }] }, { course: "MA 2071" },
      { any: [{ course: "MA 2621" }, { course: "MA 2631" }] }, { course: "CS 2223" },
    ] });
  });

  it("retains reverse-band connections and instructor approval when offering details are missing", () => {
    const map = buildCourseMap([], [{
      code: "CS 3010", title: "Example course", source: "https://example.org/catalog",
      wording: "CS 4000 or instructor approval.",
      background: { any: [{ course: "CS 4000" }, { note: "instructor approval" }] },
    }]);
    expect(map.connections).toEqual([{ from: "CS 4000", to: "CS 3010" }]);
    expect(map.nodes.map((node) => [node.code, node.band, node.offering])).toEqual([["CS 3010", 3000, null], ["CS 4000", 4000, null]]);
    expect(map.nodes[0].background).toEqual({ any: [{ course: "CS 4000" }, { note: "instructor approval" }] });
    expect(map.nodes[1].source).toBe("https://example.org/catalog");
  });

  it("includes current CS electives, cross-listed offerings and connected courses without offering data", () => {
    const offering: Course = { code: "MA 3257", subject: "MA", title: "Numerical Methods for Linear and Nonlinear Systems", credits: 1 / 3, level: "Undergraduate", description: "Term description", sections: [], options: [] };
    const map = buildCourseMap([offering]);
    expect(map.nodes.find((node) => node.code === "CS 4032")?.offering).toEqual(offering);
    expect(map.nodes.find((node) => node.code === "MA 2071")).toMatchObject({ band: 2000, offering: null });
    expect(map.nodes.find((node) => node.code === "CS 4344")?.background).toEqual({ all: [
      { any: [{ course: "CS 1004" }, { course: "CS 1101" }, { course: "CS 1102" }] },
      { any: [{ course: "CS 2102" }, { course: "CS 2103" }, { course: "CS 2119" }] },
      { any: [{ course: "DS 3010" }, { course: "CS 4445" }, { course: "CS 4342" }, { note: "equivalent machine learning" }] },
    ] });
    expect(map.connections.filter((edge) => edge.to === "CS 4731").map((edge) => edge.from)).toEqual(["CS 2223", "CS 2303", "MA 2071"]);
    expect(map.connections.some((edge) => edge.from === "CS 4731" && edge.to === "CS 4300")).toBe(true);
    expect(map.nodes.find((node) => node.code === "CS 4099")?.wording).toContain("No background statement is listed");
    expect(map.nodes.find((node) => node.code === "CS 4801")?.wording).toContain("Suggested Background");
    expect(map.connections.some((edge) => edge.from === "CS 2022" && edge.to === "CS 4801")).toBe(false);
  });

  it("treats courses illustrating graphics experience as alternatives to that experience", () => {
    const graphics = buildCourseMap([]).nodes.find((node) => node.code === "CS 4300")!;
    expect(graphics.background).toEqual({ any: [
      { note: "experience with graphics, web, or game engine programming and multimedia development" },
      { course: "CS 4731" }, { course: "CS 4241" }, { course: "IMGD 4000" },
    ] });
  });
});
