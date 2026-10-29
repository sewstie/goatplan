import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { SaveScheduleButton } from "./SaveScheduleButton";
import { PlansPageActions } from "./PlansPageActions";
import { PlanActions } from "./PlanActions";
import { createPlan, getPlansSource } from "@/lib/plans";
import { getPlannerStore } from "@/lib/store";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: React.ComponentProps<"a">) => <a href={href} {...rest}>{children}</a> }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => "/plans", useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  getPlansSource().remove("header-plan");
  getPlansSource().setCurrent("2027-C", null);
  resetPlanner();
});

it("shows save state on the button without a separate status message", () => {
  setPlanner();
  const plan = createPlan(getPlannerStore().getState(), { id: "header-plan", name: "Plan 1", savedAt: new Date() })!;
  getPlansSource().save(plan);
  getPlansSource().setCurrent("2027-C", plan.id);
  render(<PlanActions />);
  expect(screen.getByRole("button", { name: "Schedule saved" })).toBeVisible();
  expect(screen.queryByText("Schedule saved")).not.toBeInTheDocument();
  expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
});

it("saves only when there are changes, and keeps the saved state focusable", async () => {
  const onSave = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(<SaveScheduleButton saved={false} disabled={false} onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "Save schedule" }));
  expect(onSave).toHaveBeenCalledOnce();
  rerender(<SaveScheduleButton saved disabled={false} onSave={onSave} />);
  const saved = screen.getByRole("button", { name: "Schedule saved" });
  expect(saved).toHaveFocus();
  expect(saved).toHaveAttribute("aria-disabled", "true");
  await user.keyboard("{Enter}");
  expect(onSave).toHaveBeenCalledOnce();
});

it("returns to the planner from the saved-plans header instead of offering save controls", () => {
  setPlanner();
  render(<PlansPageActions />);
  expect(screen.getByRole("link", { name: "Back to planner" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("button", { name: /Save/ })).not.toBeInTheDocument();
});

it("keeps the schedule switcher without source buttons", () => {
  setPlanner();
  render(<ScheduleBrowser />);
  expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "Schedule 1 of 3")).toBeVisible();
  expect(screen.queryByRole("group", { name: "Schedule source" })).not.toBeInTheDocument();
});
