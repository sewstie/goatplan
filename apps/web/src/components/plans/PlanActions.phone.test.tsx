import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { createPlan, getPlansSource } from "@/lib/plans";
import { getPlannerStore } from "@/lib/store";
import { PlanActions } from "./PlanActions";

// On a phone the Save button keeps a short visible label ("Save" / "Saved") with its status under
// it, and stays a 44px touch target. On a tablet and wider the full text buttons stay.
// usePhoneViewport() drives the switch via window.matchMedia.

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
  it("shows a short Save label, named Save for assistive tech", () => {
    mockPhoneViewport();
    setPlanner();
    render(<PlanActions />);

    expect(screen.getByRole("button", { name: "Save" })).toHaveTextContent("Save");
  });

  it("gives the Save button a 44px touch target", () => {
    mockPhoneViewport();
    setPlanner();
    render(<PlanActions />);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("min-h-44");
  });

  it("shows Saved with a status line once the plan is saved", () => {
    mockPhoneViewport();
    setPlanner();
    withSavedPlan();
    render(<PlanActions />);

    expect(screen.getByRole("button", { name: "Schedule saved" })).toHaveTextContent("Saved");
    expect(screen.getByText("Schedule saved")).toBeInTheDocument();
  });

  it("lets a layout place the menu and Save button apart", () => {
    mockPhoneViewport();
    setPlanner();
    render(
      <PlanActions
        layout={({ menu, save }) => (
          <>
            <div data-testid="title-row">{menu}</div>
            <div data-testid="browser-row">{save}</div>
          </>
        )}
      />,
    );

    expect(screen.getByTestId("title-row")).toHaveTextContent("Saved plans");
    expect(screen.getByTestId("browser-row")).toHaveTextContent("Save");
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
