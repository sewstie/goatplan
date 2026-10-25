import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { getPlansSource, openPlanInPlanner } from "@/lib/plans";
import { designPlan, termWith } from "@/lib/plans/testing";
import { PlannerProvider, selectChosenSections } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, solved, termSummary } from "@/lib/store/testing/fixtures";
import { PlanActions } from "./PlanActions";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  for (const plan of getPlansSource().getSnapshot().plans) getPlansSource().remove(plan.id);
  getPlansSource().setCurrent("2027-C", null);
});

it("keeps unsaved work on Cancel and starts fresh only after confirmation", async () => {
  const { store, plan, user } = await setup("unsaved");
  const before = store.getState();
  const trigger = screen.getByRole("button", { name: "Saved plans" });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Start a new plan" }));
  const dialog = screen.getByRole("dialog", { name: "Start a new plan?" });
  expect(dialog).toHaveTextContent("Your unsaved changes to this schedule will be lost.");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(store.getState()).toBe(before);
  expect(trigger).toHaveFocus();
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Start a new plan" }));
  await user.click(within(screen.getByRole("dialog", { name: "Start a new plan?" })).getByRole("button", { name: "Start a new plan" }));
  await waitFor(() => expect(store.getState().courses).toEqual([]));
  expect(store.getState().savedPlanId).toBeNull();
  expect(getPlansSource().getSnapshot().plans).toContainEqual(plan);
});

it("saves a fresh plan separately from the plan it replaced", async () => {
  const { store, plan, user } = await setup("saved");
  await user.click(screen.getByRole("button", { name: "Saved plans" }));
  await user.click(screen.getByRole("button", { name: "Start a new plan" }));
  await act(async () => {
    store.getState().addCourse("AE 2410");
    await store.getState().retrySolve();
  });
  await user.click(screen.getByRole("button", { name: "Save schedule" }));
  const naming = screen.getByRole("dialog", { name: "Save schedule" });
  await user.clear(within(naming).getByRole("textbox", { name: "Plan name" }));
  await user.type(within(naming).getByRole("textbox", { name: "Plan name" }), "New classes");
  await user.click(within(naming).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Schedule saved" })).toBeVisible());
  const snapshot = getPlansSource().getSnapshot();
  expect(snapshot.plans).toContainEqual(plan);
  const fresh = snapshot.plans.find((item) => item.name === "New classes");
  expect(fresh?.courses).toEqual(["AE 2410"]);
  expect(fresh?.id).not.toBe(plan.id);
});

async function setup(draft: "empty" | "unsaved" | "saved" = "empty") {
  const plan = designPlan({ name: "Morning classes" });
  const store = createPlannerStore({
    storage: null,
    engine: { loadTerm: async (id) => loaded(id), solve: async (request) => solved(request) },
    loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }),
    loadTerm: async () => termWith(plan),
    takeTermBuffer: () => null,
    now: () => new Date("2026-10-17T12:00:00Z"),
  });
  await store.getState().init();
  if (draft === "unsaved") {
    store.getState().addCourse("AE 2320");
    await store.getState().retrySolve();
  }
  getPlansSource().save(plan);
  if (draft === "saved") {
    getPlansSource().setCurrent(plan.termId, plan.id);
    await openPlanInPlanner(store, plan);
  }
  store.getState().setSavedPlans([plan]);
  store.getState().showSaved(plan.id);
  render(
    <PlannerProvider store={store}>
      <CourseSearchPanel />
      <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1}>
        <ScheduleBrowser />
      </div>
      <PlanActions />
    </PlannerProvider>,
  );
  return { store, plan, user: userEvent.setup() };
}

it("opens the viewed saved plan as the working draft immediately when there are no unsaved changes", async () => {
  const { store, user } = await setup();
  expect(screen.queryByRole("button", { name: "Edit this plan" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Saved plans" }));
  await user.click(screen.getByRole("button", { name: /Morning classes/ }));
  await waitFor(() => expect(store.getState().savedPlanId).toBeNull());
  expect(store.getState().courses).toEqual(["AE 2320", "AE 2410", "AE 2210"]);
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX02"] });
  await waitFor(() => expect(selectChosenSections(store.getState())["AE 2320"]).toEqual(["AE 2320-CL01", "AE 2320-CX02"]));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit this plan" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("Opened “Morning classes” for editing.");
});

it("starts an empty plan with default preferences and preserves the saved plan", async () => {
  const { store, plan, user } = await setup("saved");
  await user.click(screen.getByRole("button", { name: "Saved plans" }));
  await user.click(screen.getByRole("button", { name: "Start a new plan" }));
  await waitFor(() => expect(store.getState().courses).toEqual([]));
  expect(store.getState().preferences).toEqual({ startsAfter: 0, blocked: [], onlyOpen: true });
  expect(store.getState().locks).toEqual({});
  expect(store.getState().professorByCourse).toEqual({});
  expect(store.getState().alternatives).toEqual({});
  expect(store.getState().sortPreset).toBe("bestOverall");
  expect(store.getState().savedPlanId).toBeNull();
  expect(getPlansSource().getSnapshot().current[plan.termId]).toBeUndefined();
  expect(getPlansSource().getSnapshot().plans).toContainEqual(plan);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: "Search courses" })).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("Started a new plan.");
});

it("keeps the draft and Saved mode when opening is cancelled", async () => {
  const { store, user } = await setup("unsaved");
  const before = store.getState();
  const trigger = screen.getByRole("button", { name: "Saved plans" });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: /Morning classes/ }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(store.getState()).toBe(before);
  expect(trigger).toHaveFocus();
  expect(screen.getByRole("status", { name: /Saved plan 1 of 1/ })).toBeVisible();
  expect(screen.queryByText("Opened “Morning classes” for editing.")).not.toBeInTheDocument();
});

it("confirms before replacing unsaved work, then focuses the switcher and announces the opened plan", async () => {
  const { store, user } = await setup("unsaved");
  await user.click(screen.getByRole("button", { name: "Saved plans" }));
  await user.click(screen.getByRole("button", { name: /Morning classes/ }));
  const dialog = screen.getByRole("dialog", { name: "Open “Morning classes”?" });
  expect(dialog).toHaveTextContent("Your unsaved changes to the C Term schedule will be lost.");
  expect(store.getState().courses).toEqual(["AE 2320"]);
  expect(store.getState().savedPlanId).toBe("plan-1");
  await user.click(within(dialog).getByRole("button", { name: "Open plan" }));
  await waitFor(() => expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus());
  expect(store.getState().savedPlanId).toBeNull();
  expect(store.getState().courses).toEqual(["AE 2320", "AE 2410", "AE 2210"]);
  expect(screen.getByRole("status")).toHaveTextContent("Opened “Morning classes” for editing.");
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
});

it("returns focus on every edit when the viewed plan is already the unchanged draft", async () => {
  const { store, plan, user } = await setup("saved");
  const response = store.getState().response;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await user.click(screen.getByRole("button", { name: "Saved plans" }));
    await user.click(screen.getByRole("button", { name: /Morning classes/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
    expect(store.getState().savedPlanId).toBeNull();
    expect(store.getState().response).toBe(response);
    if (attempt === 0) act(() => store.getState().showSaved(plan.id));
  }
});
