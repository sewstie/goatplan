import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { getPlannerStore } from "@/lib/store";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";
import { ScheduleSourceToggle } from "./ScheduleSourceToggle";

afterEach(resetPlanner);

it("disables Saved for an empty term and explains why on hover and focus", async () => {
  setPlanner({ savedPlans: [designPlan({ termId: "2027-D" })] });
  const user = userEvent.setup();
  render(<ScheduleSourceToggle />);
  const saved = screen.getByRole("button", { name: "Saved" });
  expect(saved).toHaveAttribute("aria-disabled", "true");
  expect(saved).toHaveAccessibleDescription("No saved plans for this term yet");
  await user.click(saved);
  expect(saved).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("tooltip")).toHaveTextContent("No saved plans for this term yet");
});

it("switches sources with native buttons, keeps focus, and announces the view", async () => {
  setPlanner({ savedPlans: [designPlan()] });
  const user = userEvent.setup();
  render(<ScheduleSourceToggle />);
  const group = screen.getByRole("group", { name: "Schedule source" });
  const saved = within(group).getByRole("button", { name: "Saved" });
  const found = within(group).getByRole("button", { name: "Found" });
  expect(found).toHaveAttribute("aria-pressed", "true");
  await user.tab();
  await user.tab();
  expect(saved).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(saved).toHaveAttribute("aria-pressed", "true");
  expect(saved).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("Showing saved plans");
  await user.click(found);
  expect(found).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("Showing found schedules");
  expect(getPlannerStore().getState().savedPlanId).toBeNull();
});
