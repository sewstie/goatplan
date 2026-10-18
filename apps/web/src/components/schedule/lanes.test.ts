import { describe, expect, it } from "vitest";
import { assignLanes } from "./lanes";

describe("assignLanes", () => {
  it("gives items that don't overlap the whole column", () => {
    const a = { start: 540, end: 590 };
    const b = { start: 600, end: 650 };
    const lanes = assignLanes([b, a]);
    expect(lanes.get(a)).toEqual({ lane: 0, lanes: 1 });
    expect(lanes.get(b)).toEqual({ lane: 0, lanes: 1 });
  });

  it("puts a clash side by side (div.app-7.md)", () => {
    const lecture = { start: 540, end: 590 };
    const other = { start: 540, end: 590 };
    const later = { start: 600, end: 650 };
    const lanes = assignLanes([lecture, other, later]);
    expect(lanes.get(lecture)).toEqual({ lane: 0, lanes: 2 });
    expect(lanes.get(other)).toEqual({ lane: 1, lanes: 2 });
    expect(lanes.get(later)).toEqual({ lane: 0, lanes: 1 });
  });

  it("reuses a lane once it's free and keeps the group's width", () => {
    const long = { start: 540, end: 700 };
    const first = { start: 540, end: 590 };
    const second = { start: 600, end: 650 };
    const lanes = assignLanes([long, first, second]);
    expect(lanes.get(first)).toEqual({ lane: 0, lanes: 2 });
    expect(lanes.get(long)).toEqual({ lane: 1, lanes: 2 });
    expect(lanes.get(second)).toEqual({ lane: 0, lanes: 2 });
  });

  it("treats touching items as not overlapping", () => {
    const a = { start: 540, end: 600 };
    const b = { start: 600, end: 650 };
    expect(assignLanes([a, b]).get(b)).toEqual({ lane: 0, lanes: 1 });
  });
});
