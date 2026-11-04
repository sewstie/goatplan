import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEGREE_FLAG_KEY,
  disableDegree,
  enableDegree,
  isDegreeEnabled,
  useDegreeEnabled,
} from "./flags";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isDegreeEnabled", () => {
  it("is off by default", () => {
    expect(isDegreeEnabled()).toBe(false);
  });

  it("is on once the flag is set to 'on'", () => {
    localStorage.setItem(DEGREE_FLAG_KEY, "on");
    expect(isDegreeEnabled()).toBe(true);
  });

  it("is off for any other stored value", () => {
    localStorage.setItem(DEGREE_FLAG_KEY, "true");
    expect(isDegreeEnabled()).toBe(false);
  });

  it("returns false instead of throwing when reading storage fails", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(isDegreeEnabled()).toBe(false);
  });
});

describe("enableDegree", () => {
  it("turns the flag on", () => {
    enableDegree();
    expect(isDegreeEnabled()).toBe(true);
    expect(localStorage.getItem(DEGREE_FLAG_KEY)).toBe("on");
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => enableDegree()).not.toThrow();
    expect(isDegreeEnabled()).toBe(false);
  });
});

describe("disableDegree", () => {
  it("turns the flag off again", () => {
    enableDegree();
    expect(isDegreeEnabled()).toBe(true);
    disableDegree();
    expect(isDegreeEnabled()).toBe(false);
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => disableDegree()).not.toThrow();
  });
});

describe("useDegreeEnabled", () => {
  beforeEach(() => localStorage.clear());

  it("starts false and corrects after mount when the flag is off", () => {
    const { result } = renderHook(() => useDegreeEnabled());
    expect(result.current).toBe(false);
  });

  it("reports true after mount when the flag is on", () => {
    localStorage.setItem(DEGREE_FLAG_KEY, "on");
    const { result } = renderHook(() => useDegreeEnabled());
    expect(result.current).toBe(true);
  });

  it("follows the storage event from another tab", () => {
    const { result } = renderHook(() => useDegreeEnabled());
    expect(result.current).toBe(false);
    act(() => {
      localStorage.setItem(DEGREE_FLAG_KEY, "on");
      window.dispatchEvent(new StorageEvent("storage", { key: DEGREE_FLAG_KEY, newValue: "on" }));
    });
    expect(result.current).toBe(true);
  });
});
