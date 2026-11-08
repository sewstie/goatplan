import { describe, expect, it } from "vitest";
import type { MapSource } from "./courseMap";
import { buildFlowchart, chainOf, edgeKey, extraText } from "./flowchart";

const flow = buildFlowchart();
const into = (code: string) => flow.edges.filter((edge) => edge.to === code);

describe("CS flowchart", () => {
  it("places every major course and leaves out courses that never count toward the major", () => {
    expect(flow.hidden).toEqual(["CS 1004", "CS 1005", "CS 2119"]);
    expect(flow.courses).toHaveLength(49);
  });

  it("draws interchangeable courses as one choice", () => {
    expect(into("CS 2102")).toEqual([{ from: "CS 1101 or CS 1102", to: "CS 2102", optional: false }]);
    expect(into("CS 2223").map((edge) => edge.from)).toEqual(["CS 2102 or CS 2103", "CS 2022"]);
    expect(into("CS 3013").map((edge) => edge.from)).toEqual(["CS 2011"]);
  });

  it("skips arrows that a longer chain already shows", () => {
    expect(into("CS 4341").map((edge) => edge.from)).toEqual(["CS 3133"]);
    expect(into("CS 4401").map((edge) => edge.from)).toEqual(["CS 3013"]);
    expect(flow.links.filter((link) => link.to === "CS 4341").map((link) => link.from)).toEqual(["CS 2102", "CS 2103", "CS 2223", "CS 3133"]);
  });

  it("keeps a required link when the only other route is one of several options", () => {
    expect(into("CS 4344")).toEqual([
      { from: "CS 2102 or CS 2103", to: "CS 4344", optional: false },
      { from: "CS 4445", to: "CS 4344", optional: true },
      { from: "CS 4342", to: "CS 4344", optional: true },
    ]);
  });

  it("lists background from outside CS on the course instead of drawing it", () => {
    const extras = (code: string) => flow.courses.find((course) => course.code === code)!.extras;
    expect(extras("CS 4342")).toEqual(["MA 1024/1034", "MA 2071", "MA 2621/2631"]);
    expect(extras("CS 4515")).toEqual(["or ECE 2049"]);
    expect(extras("CS 4100")).toEqual(["IMGD 3000/4000"]);
    expect(extraText(extras("CS 4342"))).toBe("+ MA 1024/1034, MA 2071, MA 2621/2631");
    expect(extraText(["MA 2071", "or ECE 2049"])).toBe("+ MA 2071 · or ECE 2049");
  });

  it("tags the major's area courses", () => {
    const area = (code: string) => flow.courses.find((course) => course.code === code)!.area;
    expect([area("CS 3013"), area("CS 4123"), area("CS 3733"), area("CS 3043"), area("CS 4404"), area("CS 2223")]).toEqual(["systems", "theory", "design", "social", "cyber", null]);
  });

  it("follows a course back to the first class and forward to what it opens", () => {
    const chain = chainOf(flow, "CS 3133");
    for (const code of ["CS 2223", "CS 2022", "CS 2102 or CS 2103", "CS 2102", "CS 2103", "CS 1101 or CS 1102", "CS 1101", "CS 4123", "CS 4341", "CS 4533", "CS 4536"]) expect(chain.nodes).toContain(code);
    expect(chain.nodes).not.toContain("CS 3013");
    expect(chain.edges).toContain(edgeKey({ from: "CS 2223", to: "CS 3133" }));
    expect(chain.edges).toContain(edgeKey({ from: "CS 3133", to: "CS 4536" }));
    expect(chain.edges).not.toContain(edgeKey({ from: "CS 2303", to: "CS 4536" }));
  });

  it("does not treat the other half of a choice as something a course leads to", () => {
    const chain = chainOf(flow, "CS 2102");
    expect(chain.nodes).toContain("CS 2223");
    expect(chain.nodes).not.toContain("CS 2103");
  });

  it("refuses a layout that splits a choice across rows", () => {
    const record = (code: string): MapSource => ({ code, title: code, source: "https://example.org", wording: "None.", background: null });
    expect(() => buildFlowchart([record("CS 1101"), record("CS 1102")], { rows: [["CS 1101"], ["CS 1102"]], pairs: [["CS 1101", "CS 1102"]], areas: {} })).toThrow("side by side");
  });
});
