import { describe, expect, it } from "vitest";
import { floatingPosition } from "./floatingPosition";

describe("floatingPosition", () => {
  const viewport = { width: 1440, height: 900 };
  const tooltip = { width: 220, height: 128 };
  const calendar = { offsetX: -8, gap: 24 };

  it("sits under the anchor, moved by the offset", () => {
    expect(floatingPosition({ left: 520, top: 318, bottom: 370 }, tooltip, viewport, calendar)).toEqual({
      left: 512,
      top: 394,
    });
  });

  it("goes above an anchor near the bottom and stays on screen", () => {
    expect(floatingPosition({ left: 1400, top: 800, bottom: 850 }, tooltip, viewport, calendar)).toEqual({
      left: 1212,
      top: 648,
    });
    expect(floatingPosition({ left: 0, top: 100, bottom: 150 }, tooltip, viewport, calendar).left).toBe(8);
  });

  it("prefers the top when asked, and goes below when there's no room above", () => {
    expect(floatingPosition({ left: 100, top: 400, bottom: 430 }, tooltip, viewport, { placement: "top" }).top).toBe(266);
    expect(floatingPosition({ left: 100, top: 40, bottom: 70 }, tooltip, viewport, { placement: "top" }).top).toBe(76);
  });

  it("stays below when it fits on neither side", () => {
    expect(floatingPosition({ left: 100, top: 60, bottom: 840 }, tooltip, viewport).top).toBe(846);
  });
});
