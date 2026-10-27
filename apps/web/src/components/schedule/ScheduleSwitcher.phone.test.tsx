import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";

// Ticket 11, requirement 3: the switcher's badges (the arrows and the "Schedule N of M" pill) wrap
// as whole pills when the row is narrow, with a 4px vertical and 8px horizontal gap. In Tailwind
// that is flex-wrap with gap-y-4 gap-x-8 (gap-7 is the old single 7px gap that didn't wrap).
// Requirement 5: on a phone the arrows are 44x44px touch targets.

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

describe("ScheduleSwitcher wrapping", () => {
  it("wraps its badges as whole pills", () => {
    mockPhoneViewport();
    setPlanner();
    render(<ScheduleSwitcher />);

    expect(switcherGroup().className).toContain("flex-wrap");
  });

  it("uses a 4px vertical and 8px horizontal gap between the badges", () => {
    mockPhoneViewport();
    setPlanner();
    render(<ScheduleSwitcher />);

    const group = switcherGroup();
    expect(group.className).toContain("gap-y-4");
    expect(group.className).toContain("gap-x-8");
    // The old single uniform gap must be gone, so wrapped rows get the smaller vertical gap.
    expect(group.className).not.toMatch(/\bgap-7\b/);
  });

  it("keeps wrapping available on a tablet too, since the header can still be narrow", () => {
    mockTabletViewport();
    setPlanner();
    render(<ScheduleSwitcher />);

    const group = switcherGroup();
    expect(group.className).toContain("flex-wrap");
    expect(group.className).toContain("gap-y-4");
    expect(group.className).toContain("gap-x-8");
  });
});

describe("ScheduleSwitcher touch targets on a phone", () => {
  it("gives the arrows 44px touch targets", () => {
    mockPhoneViewport();
    setPlanner();
    render(<ScheduleSwitcher />);

    for (const name of ["Previous schedule", "Next schedule"]) {
      const arrow = screen.getByRole("button", { name });
      // The spacing scale is 1px per step (--spacing: 1px), so a 44px target is min-w-44/min-h-44,
      // or an expanding ::after hit area that grows the small icon button to the touch size.
      const reachesTouchSize =
        (/\bmin-w-44\b/.test(arrow.className) && /\bmin-h-44\b/.test(arrow.className)) ||
        /after:/.test(arrow.className);
      expect(reachesTouchSize).toBe(true);
    }
  });
});
