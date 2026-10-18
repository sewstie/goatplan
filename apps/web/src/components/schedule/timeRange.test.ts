import { describe, expect, it } from "vitest";
import { DEFAULT_RANGE, fitRange, hourMarks, percentOf } from "./timeRange";

describe("fitRange", () => {
  it.each([
    ["empty plan", [], { start: 480, end: 1020 }],
    ["8:00–8:50 AM", [{ start: 480, end: 530 }], { start: 480, end: 1020 }],
    ["7:30 AM start", [{ start: 450, end: 500 }], { start: 420, end: 1020 }],
    ["6:00–6:50 PM", [{ start: 1080, end: 1130 }], { start: 480, end: 1140 }],
    ["blocked 6–8 PM", [{ start: 1080, end: 1200 }], { start: 480, end: 1200 }],
    ["exact hour boundaries", [{ start: 420, end: 1200 }], { start: 420, end: 1200 }],
    ["all day", [{ start: 0, end: 1440 }], { start: 0, end: 1440 }],
  ])("fits %s without shrinking below 8 AM–5 PM", (_name, items, expected) => {
    expect(fitRange(items)).toEqual(expected);
  });
});

describe("hourMarks", () => {
  it("labels every hour, including both ends", () => {
    expect(hourMarks(DEFAULT_RANGE)).toEqual([480, 540, 600, 660, 720, 780, 840, 900, 960, 1020]);
  });
});

describe("percentOf", () => {
  it("places a time inside the range", () => {
    expect(percentOf(DEFAULT_RANGE, 480)).toBe(0);
    expect(percentOf(DEFAULT_RANGE, 750)).toBe(50);
    expect(percentOf(DEFAULT_RANGE, 1020)).toBe(100);
  });
});
