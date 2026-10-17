import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins class names and skips empty values", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });
});
