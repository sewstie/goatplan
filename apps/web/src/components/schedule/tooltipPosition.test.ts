import { describe, expect, it } from "vitest";
import { tooltipPosition } from "./tooltipPosition";

describe("tooltipPosition", () => {
  const viewport = { width: 1440, height: 900 };

  it("sits under the block, a little to its left", () => {
    expect(tooltipPosition({ left: 520, top: 318, bottom: 370 }, viewport)).toEqual({ left: 512, top: 394 });
  });

  it("goes above blocks near the bottom and stays on screen", () => {
    expect(tooltipPosition({ left: 1400, top: 800, bottom: 850 }, viewport)).toEqual({ left: 1212, bottom: 124 });
    expect(tooltipPosition({ left: 0, top: 100, bottom: 150 }, viewport).left).toBe(8);
  });
});
