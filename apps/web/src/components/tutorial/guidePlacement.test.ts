import { expect, it } from "vitest";
import { guidePlacement, preferredPlaces, type GuideRect } from "./guidePlacement";

const size = { width: 292, height: 270 };
const viewport = { width: 1440, height: 800 };
const sidebar = { left: 16, top: 16, width: 250, height: 768 };
const calendar = { left: 282, top: 180, width: 800, height: 604 };
const details = { left: 1098, top: 180, width: 326, height: 604 };
const covers = (position: { left: number; top: number }, rect: GuideRect) => !(position.left >= rect.left + rect.width
  || position.left + size.width <= rect.left
  || position.top >= rect.top + rect.height
  || position.top + size.height <= rect.top);

it.each([
  { left: 30, top: 92, width: 192, height: 39 },
  { left: 1180, top: 254, width: 230, height: 38 },
  { left: 252, top: 110, width: 900, height: 35 },
  { left: 1100, top: 730, width: 310, height: 34 },
])("keeps the popover in the 1440 viewport without covering $left,$top", (target) => {
  const position = guidePlacement(target, size, viewport, [{ left: target.left, top: target.top }]);
  expect(position.left).toBeGreaterThanOrEqual(8);
  expect(position.top).toBeGreaterThanOrEqual(8);
  expect(position.left + size.width).toBeLessThanOrEqual(1432);
  expect(position.top + size.height).toBeLessThanOrEqual(792);
  expect(position.left >= target.left + target.width + 6 || position.left + size.width <= target.left - 6 || position.top >= target.top + target.height + 6 || position.top + size.height <= target.top - 6).toBe(true);
});

it("keeps the preferred place while it hides no class", () => {
  const target = { left: 30, top: 92, width: 192, height: 39 };
  const preferred = { left: 278, top: 178 };
  const lateClass = { left: 300, top: 600, width: 150, height: 80 };
  expect(guidePlacement(target, size, viewport, [preferred], [lateClass])).toEqual(preferred);
});

it("moves to another side of the target when the preferred place would hide a class", () => {
  const target = { left: 30, top: 92, width: 192, height: 39 };
  const preferred = { left: 278, top: 178 };
  const mondayClass = { left: 300, top: 200, width: 150, height: 80 };
  const position = guidePlacement(target, size, viewport, [preferred], [mondayClass]);
  expect(covers(position, mondayClass)).toBe(false);
  expect(covers(position, { left: target.left - 6, top: target.top - 6, width: target.width + 12, height: target.height + 12 })).toBe(false);
});

it("covers the target only when no place avoids it, and hiding a class always loses to that", () => {
  const target = { left: 500, top: 300, width: 100, height: 40 };
  const everywhere = { left: 0, top: 0, width: 1440, height: 800 };
  const position = guidePlacement(target, size, viewport, [{ left: 500, top: 300 }], [everywhere]);
  expect(covers(position, target)).toBe(false);
});

it("sends the drawing step away from the calendar, over the details panel", () => {
  const blockTime = { left: 600, top: 140, width: 110, height: 32 };
  const [place] = preferredPlaces("availability", "tutorial-block-time", blockTime, size, { sidebar, calendar, details });
  expect(place.left).toBe(details.left + details.width - size.width);
  expect(guidePlacement(blockTime, size, viewport, [place])).toEqual(place);
});

it("points the no-match step at the diagnosis panel from its left", () => {
  const places = preferredPlaces("schedules", "tutorial-diagnosis", details, size, { sidebar, calendar, details });
  const position = guidePlacement(details, size, viewport, places);
  expect(position.left + size.width).toBeLessThanOrEqual(details.left - 6);
});

it("tries the sidebar when classes fill the bottom of the calendar on the last step", () => {
  const target = { left: 500, top: 70, width: 200, height: 40 };
  const places = preferredPlaces("schedules", "tutorial-schedules", target, size, { sidebar, calendar, details });
  const eveningClass = { left: 300, top: 600, width: 300, height: 180 };
  const position = guidePlacement(target, size, viewport, places, [eveningClass]);
  expect(covers(position, eveningClass)).toBe(false);
});

it("keeps step 4 off the calendar when the details are under it on a tablet", () => {
  const blockTime = { left: 390, top: 60, width: 110, height: 34 };
  const tablet = { sidebar: { left: 20, top: 56, width: 224, height: 1044 }, calendar: { left: 256, top: 144, width: 558, height: 630 }, details: { left: 256, top: 786, width: 558, height: 314 } };
  const [place] = preferredPlaces("availability", "tutorial-block-time", blockTime, size, tablet);
  expect(place.left).toBe(tablet.sidebar.left);
});
