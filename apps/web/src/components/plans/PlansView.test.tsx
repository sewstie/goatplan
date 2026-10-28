import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { PlansPreferences } from "./PlansPreferences";
import { PlansSidebar } from "./PlansSidebar";

const selected = vi.hoisted(() => ({ plan: null as ReturnType<typeof designPlan> | null, currentId: "open-plan" }));
vi.mock("./useSelectedPlan", () => ({
  useSelectedPlan: () => ({ plan: selected.plan, snapshot: { current: { "2027-C": selected.currentId } } }),
}));
vi.mock("./useOpenPlan", () => ({ useOpenPlan: () => ({ requestOpen: vi.fn(), dialog: null }) }));

afterEach(resetPlanner);

describe("saved plan view", () => {
  it("shows the saved snapshot's courses and preferences as read-only", () => {
    setPlanner();
    const plan = designPlan();
    selected.plan = { ...plan, courses: ["AE 2210"], schedule: [plan.schedule[2]], preferences: { startsAfter: 0, blocked: [{ day: "Sun", start: 1080, end: 1200, label: "Job" }], onlyOpen: false }, sortPreset: "fewestDays" };
    render(<><PlansSidebar /><PlansPreferences /></>);
    const courses = screen.getByRole("region", { name: "Your courses" });
    expect(courses).toHaveTextContent("AE 2210");
    expect(courses).not.toHaveTextContent("AE 2320");
    expect(within(courses).queryByRole("button")).not.toBeInTheDocument();
    const preferences = screen.getByRole("group", { name: "Preferences" });
    expect(preferences).toHaveTextContent("Any time");
    expect(preferences).toHaveTextContent("Job");
    expect(preferences).toHaveTextContent("Most days off");
    expect(within(preferences).getByRole("switch")).toBeDisabled();
    expect(within(preferences).queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open in planner to edit" })).toBeEnabled();
  });

  it("keeps the current plan's courses editable but its preferences read-only", () => {
    setPlanner();
    selected.plan = designPlan({ id: selected.currentId });
    render(<><PlansSidebar /><PlansPreferences /></>);
    // The courses list stays editable for the plan you're actively working on.
    expect(screen.getByRole("button", { name: "Remove AE 2320" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Open in planner to edit" })).not.toBeInTheDocument();
    // Preferences and sort are a record of the saved plan, so they're read-only here, not editable.
    const preferences = screen.getByRole("group", { name: "Preferences" });
    expect(within(preferences).getByRole("switch")).toBeDisabled();
    expect(within(preferences).queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Block a time" })).not.toBeInTheDocument();
  });

  it("is read-only for another term even when that term remembers this plan as current", () => {
    setPlanner({ termId: "2026-B" });
    selected.plan = designPlan({ id: selected.currentId });
    render(<PlansSidebar />);
    expect(screen.getByRole("button", { name: "Open in planner to edit" })).toBeEnabled();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
