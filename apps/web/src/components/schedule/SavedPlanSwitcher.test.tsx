import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";
import { SavedPlanSwitcher } from "./SavedPlanSwitcher";

afterEach(resetPlanner);

it("pages without wrapping, announces the label, and exposes the whole long name", async () => {
  const name = "My saved plan with a name that needs plenty of room in the header";
  setPlanner({ savedPlans: [designPlan(), designPlan({ id: "second", name })], savedPlanId: "plan-1" });
  const user = userEvent.setup();
  render(<SavedPlanSwitcher />);
  const previous = screen.getByRole("button", { name: "Previous saved plan" });
  const next = screen.getByRole("button", { name: "Next saved plan" });
  expect(previous).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("status")).toHaveTextContent("Saved plan 1 of 2 · Plan 1");
  await user.click(next);
  expect(next).toHaveAttribute("aria-disabled", "true");
  expect(next).toHaveFocus();
  expect(screen.getByRole("status")).toHaveAccessibleName(`Saved plan 2 of 2 · ${name}`);
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("status")).toHaveTextContent("Saved plan 2 of 2");
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("status")).toHaveTextContent("Saved plan 1 of 2");
});
