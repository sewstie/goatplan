import { describe, expect, it } from "vitest";
import { DEFAULT_RANGE, fitRange, hourMarks, percentOf } from "./timeRange";

describe("fitRange", () => {
  it("shows 8 AM–6 PM when there is nothing to fit", () => {
    expect(fitRange([])).toEqual(DEFAULT_RANGE);
    expect(fitRange([], 540)).toEqual(DEFAULT_RANGE);
  });

  it("adds half an hour on both sides of the regular planner (div.app-6.md)", () => {
    const classes = [
      { start: 540, end: 590 },
      { start: 900, end: 950 },
    ];
    const work = { start: 840, end: 960 };
    expect(fitRange([...classes, work], 540)).toEqual({ start: 510, end: 990 });
  });

  it("grows for early, evening and late items (div.app-17.md)", () => {
    expect(fitRange([{ start: 480, end: 530 }, { start: 1080, end: 1200 }], 480)).toEqual({ start: 450, end: 1230 });
  });

  it("rounds to the half hour outside the items", () => {
    expect(fitRange([{ start: 555, end: 980 }])).toEqual({ start: 510, end: 1020 });
    expect(fitRange([{ start: 570, end: 1010 }])).toEqual({ start: 540, end: 1050 });
  });

  it("counts the start-time preference as the earliest item, unless it's off", () => {
    expect(fitRange([{ start: 660, end: 710 }], 540)).toEqual({ start: 510, end: 750 });
    expect(fitRange([{ start: 660, end: 710 }], 0)).toEqual({ start: 630, end: 750 });
  });

  it("stays inside the day", () => {
    expect(fitRange([{ start: 0, end: 1440 }])).toEqual({ start: 0, end: 1440 });
  });
});

describe("hourMarks", () => {
  it("labels both half-hour ends and every full hour", () => {
    expect(hourMarks({ start: 510, end: 990 })).toEqual([510, 540, 600, 660, 720, 780, 840, 900, 960, 990]);
  });

  it("doesn't repeat ends that fall on the hour", () => {
    expect(hourMarks(DEFAULT_RANGE)).toEqual([480, 540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080]);
  });
});

describe("percentOf", () => {
  it("places a time inside the range", () => {
    expect(percentOf(DEFAULT_RANGE, 480)).toBe(0);
    expect(percentOf(DEFAULT_RANGE, 540)).toBe(10);
    expect(percentOf(DEFAULT_RANGE, 1080)).toBe(100);
  });
});
