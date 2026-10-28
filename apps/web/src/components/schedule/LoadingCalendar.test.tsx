import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoadingCalendar } from "./LoadingCalendar";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";

const realMatchMedia = window.matchMedia;

afterEach(() => {
  resetPlanner();
  Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
});

function mockViewport(phone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: phone && query === "(max-width: 39.99rem)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe("LoadingCalendar", () => {
  it("shows phone blocks with text bars on a phone", () => {
    mockViewport(true);
    setPlanner({ termStatus: "loading", term: null, response: null });
    render(<LoadingCalendar />);

    const monday = screen.getByRole("group", { name: "Monday" });
    expect(monday.querySelectorAll(":scope > span")).toHaveLength(3);
    expect(monday.querySelectorAll(":scope > span > span")).toHaveLength(9);
  });

  it("keeps the plain desktop blocks on a wider screen", () => {
    mockViewport(false);
    setPlanner({ termStatus: "loading", term: null, response: null });
    render(<LoadingCalendar />);

    const monday = screen.getByRole("group", { name: "Monday" });
    expect(monday.querySelectorAll(":scope > span")).toHaveLength(2);
    expect(monday.querySelectorAll(":scope > span > span")).toHaveLength(0);
  });
});
