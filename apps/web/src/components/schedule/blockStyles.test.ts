import { describe, expect, it } from "vitest";
import { blockPosition } from "./blockStyles";
import { blockDensity } from "./density";

const range = { start: 480, end: 1080 };

describe("blockPosition", () => {
  it("fills the column 3px in from each side and ends 3px early", () => {
    expect(blockPosition(range, { start: 540, end: 600 }, { lane: 0, lanes: 1 })).toEqual({
      top: "10%",
      height: "calc(10% - 3px)",
      left: "calc(3px + 0 * (((100% - 6px) / 1) + 2px))",
      width: "calc((100% - 6px) / 1)",
    });
  });

  it("puts the second of two lanes after the first with a 2px gap", () => {
    const style = blockPosition(range, { start: 540, end: 600 }, { lane: 1, lanes: 2 });
    expect(style.left).toBe("calc(3px + 1 * (((100% - 8px) / 2) + 2px))");
    expect(style.width).toBe("calc((100% - 8px) / 2)");
  });

  it("covers the exact range for blocked times", () => {
    expect(blockPosition(range, { start: 840, end: 960 }, { lane: 0, lanes: 1 }, 0).height).toBe("calc(20% - 0px)");
  });
});

describe("blockDensity", () => {
  it("shrinks block text with the hour height (div.app-6.md, div.app-17.md)", () => {
    expect(blockDensity(null)).toBe("regular");
    expect(blockDensity(67)).toBe("regular");
    expect(blockDensity(62)).toBe("regular");
    expect(blockDensity(56.75)).toBe("compact");
    expect(blockDensity(48)).toBe("compact");
    expect(blockDensity(41)).toBe("dense");
  });
});
