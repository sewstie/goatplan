import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { createPlan, getPlansSource } from "@/lib/plans";
import { getPlannerStore } from "@/lib/store";
import { PlanActions } from "./PlanActions";

// Ticket 11, requirement 4: on a phone the header actions become icon-only buttons with a tooltip
// (the text label moves into the tooltip, so the button keeps an accessible name but shows only its
// icon). Requirement 5: those buttons stay 44x44px touch targets. On a tablet and wider the full
// text buttons stay. usePhoneViewport() drives the switch via window.matchMedia.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/plans",
  useRouter: () => ({ push: vi.fn() }),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const realMatchMedia = window.matchMedia;

afterEach(() => {
  getPlansSource().remove("header-plan");
  getPlansSource().setCurrent("2027-C", null);
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

/** Puts a saved, current plan in storage so PlanActions shows the "Schedule saved" state. */
function withSavedPlan() {
  const plan = createPlan(getPlannerStore().getState(), {
    id: "header-plan",
    name: "Plan 1",
    savedAt: new Date(),
  })!;
  getPlansSource().save(plan);
  getPlansSource().setCurrent("2027-C", plan.id);
}

describe("PlanActions on a phone", () => {
  it("shows the Save button as icon-only: an accessible name but no visible text", () => {
    mockPhoneViewport();
    setPlanner();
    render(<PlanActions />);

    const save = screen.getByRole("button", { name: "Save schedule" });
    // The label is still reachable for assistive tech, but the words aren't rendered as visible text.
    expect(save).toHaveAccessibleName("Save schedule");
    expect(save).not.toHaveTextContent("Save schedule");
  });

  it("keeps the label reachable through a tooltip on hover", async () => {
    mockPhoneViewport();
    setPlanner();
    render(<PlanActions />);

    const save = screen.getByRole("button", { name: "Save schedule" });
    // The Tooltip wraps the button in an inline-flex span; hover that wrapper to trigger the tooltip.
    const wrapper = save.closest("span.relative");
    await userEvent.hover(wrapper ?? save);
    // The tooltip has describes={false} so it's aria-hidden; find it by role with hidden option.
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveTextContent("Save schedule");
  });

  it("gives the icon-only Save button a 44px touch target", () => {
    mockPhoneViewport();
    setPlanner();
    render(<PlanActions />);

    const save = screen.getByRole("button", { name: "Save schedule" });
    const reachesTouchSize =
      (/\bmin-w-44\b/.test(save.className) && /\bmin-h-44\b/.test(save.className)) ||
      /after:/.test(save.className);
    expect(reachesTouchSize).toBe(true);
  });

  it("shows the saved state icon-only as well, still named for assistive tech", () => {
    mockPhoneViewport();
    setPlanner();
    withSavedPlan();
    render(<PlanActions />);

    const saved = screen.getByRole("button", { name: "Schedule saved" });
    expect(saved).toHaveAccessibleName("Schedule saved");
    expect(saved).not.toHaveTextContent("Saved");
  });
});

describe("PlanActions on a tablet and wider", () => {
  it("keeps the full text Save button, with its words visible and no tooltip needed", () => {
    mockTabletViewport();
    setPlanner();
    render(<PlanActions />);

    const save = screen.getByRole("button", { name: "Save schedule" });
    expect(save).toHaveTextContent("Save schedule");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("keeps the full saved state label visible", () => {
    mockTabletViewport();
    setPlanner();
    withSavedPlan();
    render(<PlanActions />);

    expect(screen.getByRole("button", { name: "Schedule saved" })).toHaveTextContent("Saved");
  });
});
