import { describe, expect, it } from "vitest";
import { parseUnits } from "@/lib/degree";
import { unitsText } from "./unitsText";

describe("units as text", () => {
  it.each([[3, "1/3"], [1.5, "1/6"], [6, "2/3"], [9, "1"], [12, "1 1/3"], [0.75, "1/12"]])("writes %s credits as %s, and reads it back", (credits, text) => {
    expect(unitsText(credits)).toBe(text);
    expect(parseUnits(text)).toBeCloseTo(credits);
  });
});
