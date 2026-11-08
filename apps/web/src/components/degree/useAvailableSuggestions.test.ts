import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { TermFile } from "@/lib/data/types";
import type { ScheduleFit } from "@/lib/degree/recommendations/schedules";
import { useAvailableSuggestions } from "./useAvailableSuggestions";

const mocks = vi.hoisted(() => ({ fit: vi.fn(), dispose: vi.fn() }));
vi.mock("@/lib/engine", () => ({ EngineClient: class { dispose = mocks.dispose; } }));
vi.mock("@/lib/degree/recommendations/schedules", () => ({ createScheduleCheck: () => ({ fit: mocks.fit }) }));
const file = { term: { id: "2027-C" }, courses: [] } as unknown as TermFile;
beforeEach(() => { vi.clearAllMocks(); });

it("shows only candidates that fit the chosen courses and records unchecked results", async () => {
  mocks.fit.mockImplementation(async (_: TermFile, codes: string[]) => codes.includes("full") ? "clashes" : codes.includes("unknown") ? "unknown" : "fits");
  const { result, unmount } = renderHook(() => useAvailableSuggestions(file, ["free", "full", "unknown"], ["chosen"]));
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current?.available).toEqual(new Set(["free"])));
  expect(result.current?.unchecked).toBe(true);
  expect(mocks.fit).toHaveBeenCalledWith(file, ["chosen", "free"]);
  expect(mocks.dispose).toHaveBeenCalled();
  unmount();
});

it("hides stale results and ignores an old check after chosen courses change", async () => {
  let finish!: (fit: ScheduleFit) => void;
  mocks.fit.mockReturnValueOnce(new Promise<ScheduleFit>((resolve) => { finish = resolve; })).mockResolvedValue("clashes");
  const { result, rerender } = renderHook(({ chosen }) => useAvailableSuggestions(file, ["candidate"], chosen), { initialProps: { chosen: ["first"] } });
  rerender({ chosen: ["second"] });
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current?.available).toEqual(new Set()));
  await act(async () => { finish("fits"); });
  expect(result.current?.available).toEqual(new Set());
});

it("retries unchecked courses and stops its worker on unmount", async () => {
  mocks.fit.mockResolvedValueOnce("unknown").mockResolvedValue("fits");
  const { result, rerender, unmount } = renderHook(({ attempt }) => useAvailableSuggestions(file, ["candidate"], [], attempt), { initialProps: { attempt: 0 } });
  await waitFor(() => expect(result.current?.unchecked).toBe(true));
  rerender({ attempt: 1 });
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current?.available).toEqual(new Set(["candidate"])));
  unmount();
  expect(mocks.dispose).toHaveBeenCalled();
});
