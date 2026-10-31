import { describe, expect, it } from "vitest";
import { blockDensity } from "./density";

describe("blockDensity", () => {
  it("shows code, time and room from 52 px (three 16 px lines, 2 of padding, 2 of border)", () => {
    expect(blockDensity(52)).toBe("regular");
    expect(blockDensity(120)).toBe("regular");
  });

  it("drops the room below that", () => {
    expect(blockDensity(51.9)).toBe("compact");
    expect(blockDensity(38)).toBe("compact");
  });

  it("assumes room for everything before the grid is measured", () => {
    expect(blockDensity(null)).toBe("regular");
  });
});
