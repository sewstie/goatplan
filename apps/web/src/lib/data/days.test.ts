import { describe, expect, it } from "vitest";
import { DAY_NAMES, formatDays } from "./days";
import type { Day } from "./types";

describe("formatDays", () => {
  it.each<[Day[], string]>([
    [["Mon", "Thu"], "Mon, Thu"],
    [["Thu"], "Thu"],
    [["Mon", "Tue", "Wed", "Thu", "Fri"], "Mon–Fri"],
    [["Mon", "Tue", "Thu", "Fri"], "Mon, Tue, Thu, Fri"],
    [["Mon", "Tue", "Wed", "Fri"], "Mon–Wed, Fri"],
    [["Tue", "Fri"], "Tue, Fri"],
    [["Sat", "Sun"], "Sat, Sun"],
    [[], ""],
  ])("%j → %s", (days, expected) => {
    expect(formatDays(days)).toBe(expected);
  });

  it("puts days in week order and drops repeats", () => {
    expect(formatDays(["Thu", "Mon", "Thu"])).toBe("Mon, Thu");
  });
});

describe("DAY_NAMES", () => {
  it("has the full name of each day", () => {
    expect(DAY_NAMES.Tue).toBe("Tuesday");
    expect(Object.keys(DAY_NAMES)).toHaveLength(7);
  });
});
