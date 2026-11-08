import { describe, expect, it } from "vitest";
import type { MapSource } from "./courseMap";
import { buildFlowchart } from "./flowchart";
import { routeFlowchart, type Box, type Point } from "./routing";

const flow = buildFlowchart();
const layout = routeFlowchart(flow);
const segments = (points: Point[]) => points.slice(1).map((point, index) => [points[index], point] as const);

function crosses([a, b]: readonly [Point, Point], box: Box) {
  const left = Math.min(a[0], b[0]), right = Math.max(a[0], b[0]);
  const top = Math.min(a[1], b[1]), bottom = Math.max(a[1], b[1]);
  return left < box.x + box.w - 1 && right > box.x + 1 && top < box.y + box.h - 1 && bottom > box.y + 1;
}

describe("flowchart routing", () => {
  it("draws only straight horizontal and vertical lines", () => {
    for (const edge of layout.edges) for (const [a, b] of segments(edge.points)) expect(a[0] === b[0] || a[1] === b[1]).toBe(true);
  });

  it("never runs a line through a course card or a choice badge", () => {
    for (const edge of layout.edges) {
      for (const segment of segments(edge.points)) {
        for (const [code, box] of Object.entries({ ...layout.boxes, ...layout.badges })) expect(crosses(segment, box), `${edge.from} → ${edge.to} crosses ${code}`).toBe(false);
      }
    }
  });

  it("ends every arrow on the edge of its course", () => {
    for (const edge of layout.edges) {
      const [x, y] = edge.points.at(-1)!;
      const box = layout.boxes[edge.to];
      const onSide = (x === box.x || x === box.x + box.w) && y > box.y && y < box.y + box.h;
      const onTop = y === box.y && x > box.x && x < box.x + box.w;
      expect(onSide || onTop, `${edge.from} → ${edge.to}`).toBe(true);
    }
  });

  it("keeps lines from different courses apart unless they arrive at the same course", () => {
    const all = layout.edges.flatMap((edge) => segments(edge.points).map((segment) => ({ edge, segment })));
    for (const one of all) {
      for (const other of all) {
        if (one.edge.from === other.edge.from || one.edge.to === other.edge.to) continue;
        const [a, b] = one.segment, [c, d] = other.segment;
        const flat = a[1] === b[1] && c[1] === d[1] && a[1] === c[1] && Math.max(a[0], b[0]) > Math.min(c[0], d[0]) && Math.max(c[0], d[0]) > Math.min(a[0], b[0]);
        const upright = a[0] === b[0] && c[0] === d[0] && a[0] === c[0] && Math.max(a[1], b[1]) > Math.min(c[1], d[1]) && Math.max(c[1], d[1]) > Math.min(a[1], b[1]);
        expect(flat || upright, `${one.edge.from} → ${one.edge.to} overlaps ${other.edge.from} → ${other.edge.to}`).toBe(false);
      }
    }
  });

  it("stacks the course-number bands from top to bottom", () => {
    expect(layout.bands.map((band) => band.band)).toEqual([1000, 2000, 3000, 4000]);
    for (const [index, band] of layout.bands.entries()) if (index > 0) expect(band.top).toBeGreaterThan(layout.bands[index - 1].top);
    expect(layout.boxes["CS 1101"].y).toBeLessThan(layout.boxes["CS 2102"].y);
    expect(layout.boxes["CS 3133"].y).toBeLessThan(layout.boxes["CS 4123"].y);
  });

  it("refuses an arrow that would point up the map", () => {
    const record = (code: string, background: MapSource["background"] = null): MapSource => ({ code, title: code, source: "https://example.org", wording: "", background });
    const upside = buildFlowchart([record("CS 1101", { course: "CS 2102" }), record("CS 2102")], { rows: [["CS 1101"], ["CS 2102"]], pairs: [], areas: {} });
    expect(() => routeFlowchart(upside)).toThrow("points up");
  });
});
