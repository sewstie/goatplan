import { describe, expect, it } from "vitest";
import { roundedPath } from "./roundedPath";

describe("roundedPath", () => {
  it("keeps a straight line straight", () => {
    expect(roundedPath([[0, 0], [0, 40]])).toBe("M0,0 L0,40");
  });

  it("rounds each corner without overshooting short segments", () => {
    expect(roundedPath([[0, 0], [0, 20], [40, 20], [40, 24]])).toBe("M0,0 L0,14 Q0,20 6,20 L38,20 Q40,20 40,22 L40,24");
  });
});
