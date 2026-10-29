import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";

// The arrows and "Schedule N of M" are one joined control, so they never wrap apart.
// Ticket 11, requirement 5: on a phone the arrows are 44x44px touch targets.

const realMatchMedia = window.matchMedia;

afterEach(() => {
  resetPlanner();
  Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
});

function mockPhoneViewport() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 39.99rem)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function mockTabletViewport() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/** The group that lays out the arrows and the count pill. */
function switcherGroup() {
  return screen.getByRole("group", { name: "Schedules" });
}

describe("ScheduleSwitcher as one control", () => {
  it("keeps the arrows and the count together in one box", () => {
    mockTabletViewport();
    setPlanner();
    render(<ScheduleSwitcher />);

    const group = switcherGroup();
    expect(group.className).toContain("border");
    expect(group.className).not.toContain("flex-wrap");
    expect(group).toContainElement(screen.getByRole("button", { name: "Previous schedule" }));
    expect(group).toContainElement(screen.getByRole("button", { name: "Next schedule" }));
    expect(group).toHaveTextContent("Schedule 1 of 3");
  });
});

describe("ScheduleSwitcher touch targets on a phone", () => {
  it("gives the arrows 44px touch targets", () => {
    mockPhoneViewport();
    setPlanner();
    render(<ScheduleSwitcher wide />);

    // The spacing scale is 1px per step (--spacing: 1px): the box is at least 44 tall and each arrow 44 wide.
    expect(switcherGroup().className).toMatch(/\bmin-h-44\b/);
    for (const name of ["Previous schedule", "Next schedule"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/\bw-44\b/);
    }
  });
});
