import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TimeRange } from "./timeRange";
import { useHeldRange } from "./useHeldRange";

const NORMAL = { start: 480, end: 1020 };
const EVENING = { start: 480, end: 1200 };

function setup(range: TimeRange, active: boolean) {
  return renderHook((props) => useHeldRange(props.range, props.active), { initialProps: { range, active } });
}

describe("useHeldRange", () => {
  it("starts from the range it's given", () => {
    const { result, rerender } = setup(EVENING, false);
    rerender({ range: EVENING, active: true });
    expect(result.current).toEqual(EVENING);
  });

  it("doesn't shrink while active", () => {
    const { result, rerender } = setup(EVENING, true);
    rerender({ range: NORMAL, active: true });
    expect(result.current).toEqual(EVENING);
  });

  it("grows while active", () => {
    const { result, rerender } = setup(NORMAL, true);
    rerender({ range: { start: 420, end: 1080 }, active: true });
    expect(result.current).toEqual({ start: 420, end: 1080 });
  });

  it("follows the range again once inactive", () => {
    const { result, rerender } = setup(EVENING, true);
    rerender({ range: NORMAL, active: true });
    rerender({ range: NORMAL, active: false });
    expect(result.current).toEqual(NORMAL);
    rerender({ range: NORMAL, active: true });
    expect(result.current).toEqual(NORMAL);
  });
});
