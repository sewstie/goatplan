import { describe, expect, it } from "vitest";
import { nextIndex } from "./listNavigation";

describe("nextIndex", () => {
  it("moves down and stops at the last item", () => {
    expect(nextIndex(0, 3, "ArrowDown")).toBe(1);
    expect(nextIndex(2, 3, "ArrowDown")).toBe(2);
  });

  it("moves up, and leaves the list from the first item", () => {
    expect(nextIndex(2, 3, "ArrowUp")).toBe(1);
    expect(nextIndex(0, 3, "ArrowUp")).toBe(-1);
  });

  it("jumps with Home and End", () => {
    expect(nextIndex(1, 3, "Home")).toBe(0);
    expect(nextIndex(1, 3, "End")).toBe(2);
  });

  it("ignores other keys and empty lists", () => {
    expect(nextIndex(1, 3, "Enter")).toBeNull();
    expect(nextIndex(0, 0, "ArrowDown")).toBeNull();
  });
});
