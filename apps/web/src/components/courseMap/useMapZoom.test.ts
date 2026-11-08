import { describe, expect, it } from "vitest";
import { clampZoom, fitZoom, MAX_ZOOM, MIN_ZOOM, SMALLEST_FIT, wheelZoom } from "./useMapZoom";

describe("map zoom", () => {
  it("fits the map to the space but never past full size or below a readable size", () => {
    expect(fitZoom(2000, 1500)).toBe(1);
    expect(fitZoom(1230, 1500)).toBe(0.82);
    expect(fitZoom(300, 1500)).toBe(SMALLEST_FIT);
  });

  it("zooms in when scrolling up and out when scrolling down, within limits", () => {
    expect(wheelZoom(1, -100)).toBeGreaterThan(1);
    expect(wheelZoom(1, 100)).toBeLessThan(1);
    expect(wheelZoom(1, -10_000)).toBe(MAX_ZOOM);
    expect(wheelZoom(1, 10_000)).toBe(MIN_ZOOM);
    expect(clampZoom(0.8312)).toBe(0.83);
  });
});
