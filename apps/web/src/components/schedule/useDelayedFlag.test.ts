import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDelayedFlag } from "./useDelayedFlag";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDelayedFlag", () => {
  it("turns on only after the delay, and off as soon as the work stops", () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 600), {
      initialProps: { active: true },
    });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(599));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);
  });

  it("starts over for the next piece of work", () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 600), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(600));
    rerender({ active: false });
    rerender({ active: true });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(false);
  });

  it("never turns on for quick work", () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 600), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(100));
    rerender({ active: false });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(false);
  });
});
