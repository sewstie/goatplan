import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { getPlansSource } from "@/lib/plans";
import { designPlan } from "@/lib/plans/testing";
import { PlannerProvider, selectChosenSections } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import { PlannerViewSync } from "./PlannerViewSync";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

async function setup() {
  getPlansSource().getSnapshot();
  const store = createPlannerStore({
    storage: null,
    engine: { loadTerm: async (id) => loaded(id), solve: async (request) => solved(request) },
    loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }),
    loadTerm: async (id) => termFile(id),
    takeTermBuffer: () => null,
    now: () => new Date("2026-10-17T12:00:00Z"),
  });
  await store.getState().init();
  store.getState().addCourse("AE 2320");
  await store.getState().retrySolve();
  window.history.replaceState(null, "", "/?share=reserved&view=saved&plan=missing#schedule");
  render(<PlannerProvider store={store}><PlannerViewSync /><ScheduleBrowser /></PlannerProvider>);
  await waitFor(() => expect(window.location.search).toBe("?share=reserved"));
  return store;
}

it("shows the missing-plan message and restores Found while cleaning only view parameters from the URL", async () => {
  const store = await setup();
  expect(screen.getByRole("heading", { name: "This plan isn’t here" })).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("Saved plans stay in the browser they were saved in. It may have been deleted.");
  expect(screen.getByRole("link", { name: "See your saved plans" })).toHaveAttribute("href", "/plans");
  expect(screen.getByRole("group", { name: "Schedules" })).toBeVisible();
  expect(window.location.hash).toBe("#schedule");
  expect(store.getState().savedPlanId).toBeNull();
  expect(store.getState().courses).toEqual(["AE 2320"]);
  expect(selectChosenSections(store.getState())["AE 2320"]).toEqual(["AE 2320-CL01", "AE 2320-CX01"]);
});

it("clears the missing-plan message when a valid plan is opened", async () => {
  const store = await setup();
  expect(screen.getByRole("heading", { name: "This plan isn’t here" })).toBeVisible();
  const plan = designPlan();
  await act(async () => { await store.getState().openPlan(plan.termId, plan); });
  expect(screen.queryByRole("heading", { name: "This plan isn’t here" })).not.toBeInTheDocument();
});
