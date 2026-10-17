import { describe, expect, it } from "vitest";
import { formatTime, formatTimeRange, formatTimeShort } from "./time";

describe("formatTime", () => {
  it.each([
    [540, "9:00 AM"],
    [590, "9:50 AM"],
    [0, "12:00 AM"],
    [5, "12:05 AM"],
    [720, "12:00 PM"],
    [780, "1:00 PM"],
    [1439, "11:59 PM"],
    [1440, "12:00 AM"],
  ])("%i → %s", (minutes, expected) => {
    expect(formatTime(minutes)).toBe(expected);
  });

  it.each([-1, 1441, 9.5, Number.NaN])("rejects %s", (minutes) => {
    expect(() => formatTime(minutes)).toThrow(RangeError);
  });
});

describe("formatTimeShort", () => {
  it.each([
    [540, "9 AM"],
    [510, "8:30 AM"],
    [720, "12 PM"],
    [1230, "8:30 PM"],
  ])("%i → %s", (minutes, expected) => {
    expect(formatTimeShort(minutes)).toBe(expected);
  });
});

describe("formatTimeRange", () => {
  it("writes both ends in full by default", () => {
    expect(formatTimeRange(540, 590)).toBe("9:00 AM–9:50 AM");
  });

  it("shares AM/PM when both ends have it", () => {
    expect(formatTimeRange(540, 590, "shared")).toBe("9:00–9:50 AM");
    expect(formatTimeRange(900, 950, "shared")).toBe("3:00–3:50 PM");
  });

  it("keeps both periods when they differ, even when shared", () => {
    expect(formatTimeRange(660, 770, "shared")).toBe("11:00 AM–12:50 PM");
  });

  it("drops :00 in the short style", () => {
    expect(formatTimeRange(840, 960, "short")).toBe("2 PM–4 PM");
    expect(formatTimeRange(510, 990, "short")).toBe("8:30 AM–4:30 PM");
  });
});
