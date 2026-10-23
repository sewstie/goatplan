import { expect, it } from "vitest";
import { guidePlacement } from "./guidePlacement";

it.each([
  { left: 30, top: 92, width: 192, height: 39 },
  { left: 1180, top: 254, width: 230, height: 38 },
  { left: 252, top: 110, width: 900, height: 35 },
  { left: 1100, top: 730, width: 310, height: 34 },
])("keeps the popover in the 1440 viewport without covering $left,$top", (target) => {
  const size = { width: 292, height: 270 };
  const position = guidePlacement(target, size, { width: 1440, height: 800 }, { left: target.left, top: target.top });
  expect(position.left).toBeGreaterThanOrEqual(8);
  expect(position.top).toBeGreaterThanOrEqual(8);
  expect(position.left + size.width).toBeLessThanOrEqual(1432);
  expect(position.top + size.height).toBeLessThanOrEqual(792);
  expect(position.left >= target.left + target.width + 6 || position.left + size.width <= target.left - 6 || position.top >= target.top + target.height + 6 || position.top + size.height <= target.top - 6).toBe(true);
});
