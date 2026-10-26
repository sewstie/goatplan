import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePhoneViewport } from "./usePhoneViewport";

type Listener = (event: { matches: boolean }) => void;

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<Listener>();
  const mql = {
    get matches() {
      return matches;
    },
    media: "",
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("usePhoneViewport", () => {
  it("reports true below the tablet breakpoint", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePhoneViewport());
    expect(result.current).toBe(true);
  });

  it("reports false at tablet width and up", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePhoneViewport());
    expect(result.current).toBe(false);
  });

  it("updates when the viewport crosses the breakpoint", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => usePhoneViewport());
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
  });
});
