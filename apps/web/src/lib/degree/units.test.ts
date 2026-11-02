import { describe, expect, it } from "vitest";
import { formatUnits, parseUnits, unitLabel } from "./units";

describe("formatUnits", () => {
  it.each([[3, "⅓"], [0.75, "1/12"], [1.5, "⅙"], [9, "1"], [12, "1⅓"], [24, "2⅔"], [0, "0"]])("shows %d credits as %s", (credits, text) => {
    expect(formatUnits(credits)).toBe(text);
  });

  it("falls back to a decimal for an uneven size", () => {
    expect(formatUnits(2)).toBe("0.22");
  });

  it("says unit or units", () => {
    expect(unitLabel(3)).toBe("⅓ unit");
    expect(unitLabel(9)).toBe("1 unit");
    expect(unitLabel(24)).toBe("2⅔ units");
  });
});

describe("parseUnits", () => {
  it.each([["1/3", 3], ["⅓", 3], ["1/6", 1.5], ["1/12", 0.75], ["1", 9], ["1 1/3", 12], ["1⅓", 12], [" 0.5 ", 4.5]])("reads %s as %d credits", (text, credits) => {
    expect(parseUnits(text)).toBe(credits);
  });

  it.each(["", "abc", "1/0", "-1", "9"])("refuses %s", (text) => {
    expect(parseUnits(text)).toBeNull();
  });
});
