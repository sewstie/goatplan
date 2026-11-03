import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { getPlansSource } from "@/lib/plans";
import { PlannerProvider, selectViewedSchedule, usePlanner } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, solved, termFile, termSummary, MemoryStorage } from "@/lib/store/testing/fixtures";
import { encodePlan } from "@/lib/share/codec";
import { plan } from "@/lib/share/testing";
import { PlannerViewSync } from "@/components/shell/PlannerViewSync";
import { SaveSharedPlan } from "./SaveSharedPlan";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/data/load", async (original) => ({ ...await original<typeof import("@/lib/data/load")>(), loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }), loadTerm: async (id: string) => termFile(id) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
  for (const saved of getPlansSource().getSnapshot().plans) getPlansSource().remove(saved.id);
  getPlansSource().setCurrent(plan.termId, null);
});

function Actions() {
  const temporary = usePlanner((state) => state.temporaryPlan);
  return temporary ? <SaveSharedPlan view={temporary.view} /> : null;
}

async function setup(hash: string) {
  const storage = new MemoryStorage();
  const store = createPlannerStore({ storage, engine: { loadTerm: async (id) => loaded(id), solve: async (request) => solved(request) }, loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }), loadTerm: async (id) => termFile(id), takeTermBuffer: () => null });
  await store.getState().init();
  store.getState().addCourse("AB 1533");
  await store.getState().retrySolve();
  const before = [...storage.items];
  window.history.replaceState(null, "", `/?share=reserved${hash}`);
  render(<PlannerProvider store={store}><PlannerViewSync /><Actions /></PlannerProvider>);
  return { store, storage, before };
}

it("opens read-only, then closes by keyboard and clears only link data without touching the draft", async () => {
  const user = userEvent.setup();
  const { store, storage, before } = await setup(`#schedule&p=${encodePlan(plan)}`);
  await screen.findByRole("region", { name: "Shared plan" });
  expect(screen.getByRole("region", { name: "Shared plan" })).toHaveTextContent("Viewing a shared plan. Your own draft is safe. Changes require opening a separate copy.");
  expect(screen.getByRole("button", { name: "Save a copy" })).toBeEnabled();
  expect(selectViewedSchedule(store.getState())?.[0].sections.map((section) => section.id)).toEqual(plan.chosen["AE 2320"]);
  expect(window.location.search).toBe("?share=reserved");
  expect([...storage.items]).toEqual(before);
  screen.getByRole("button", { name: "Close preview" }).focus();
  await user.keyboard("{Enter}");
  expect(window.location.hash).toBe("#schedule");
  expect(store.getState().savedPlanId).toBeNull();
  expect(store.getState().courses).toEqual(["AB 1533"]);
  expect([...storage.items]).toEqual(before);
});

it.each([
  ["broken"],
  [encodePlan({ ...plan, termId: "1999-A" })],
])("shows a friendly error and keeps the draft for %s", async (data) => {
  const user = userEvent.setup();
  const { store, storage, before } = await setup(`#p=${data}`);
  const dialog = await screen.findByRole("dialog", { name: "We couldn’t open this plan" });
  expect(dialog).toHaveTextContent("Your draft hasn’t changed.");
  expect(store.getState().savedPlanId).toBeNull();
  expect([...storage.items]).toEqual(before);
  await user.click(within(dialog).getByRole("button", { name: "Return to my planner" }));
  expect(window.location.hash).toBe("");
  expect(store.getState().courses).toEqual(["AB 1533"]);
});

it("does not reopen a shared plan when its term finishes loading after Close", async () => {
  const data = await import("@/lib/data/load");
  let finish!: (term: ReturnType<typeof termFile>) => void;
  vi.spyOn(data, "loadTerm").mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  const { store, storage, before } = await setup(`#p=${encodePlan(plan)}`);
  await screen.findByText("Opening shared plan…");
  await user.click(screen.getByRole("button", { name: "Close preview" }));
  await act(async () => { finish(termFile(plan.termId)); });
  expect(screen.queryByRole("region", { name: "Shared plan" })).not.toBeInTheDocument();
  expect(store.getState().temporaryPlan).toBeNull();
  expect(window.location.hash).toBe("");
  expect([...storage.items]).toEqual(before);
});

async function saveCopy(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Save a copy" }));
  return getPlansSource().getSnapshot().plans[0];
}

it("saves a copy to Saved plans, keeps the draft and stays on the shared plan", async () => {
  const user = userEvent.setup();
  const { store, storage, before } = await setup(`#p=${encodePlan(plan)}`);
  const copy = await saveCopy(user);
  expect(copy).toMatchObject({ name: "2027-C · Shared copy", termId: plan.termId, courses: plan.courses, locks: plan.locks });
  expect(copy.id).not.toBe("__temporary__");
  const dialog = screen.getByRole("dialog", { name: "A copy is saved" });
  expect(dialog).toHaveTextContent("Saved separately from your own draft.");
  expect(store.getState().temporaryPlan).not.toBeNull();
  expect(store.getState().courses).toEqual(["AB 1533"]);
  expect(store.getState().savedPlans).toContainEqual(copy);
  expect(getPlansSource().getSnapshot().current[plan.termId]).toBeUndefined();
  expect([...storage.items]).toEqual(before);
});

it("renames the copy from the saved screen", async () => {
  const user = userEvent.setup();
  await setup(`#p=${encodePlan(plan)}`);
  await saveCopy(user);
  const name = screen.getByRole("textbox", { name: "Saved plan name" });
  await user.clear(name);
  await user.type(name, "With my roommate");
  await user.click(screen.getByRole("button", { name: "Back to my draft" }));
  expect(getPlansSource().getSnapshot().plans[0].name).toBe("With my roommate");
  expect(window.location.hash).toBe("");
});

it("says so when the browser can't keep the copy, and lets the student try again", async () => {
  const user = userEvent.setup();
  const save = vi.spyOn(getPlansSource(), "save").mockReturnValueOnce(false);
  await setup(`#p=${encodePlan(plan)}`);
  await user.click(await screen.findByRole("button", { name: "Save a copy" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t save. Browser storage is full or blocked.");
  await user.click(screen.getByRole("button", { name: "Save a copy" }));
  expect(save).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "A copy is saved" })).toBeVisible();
  save.mockRestore();
});

it("warns before Open for editing replaces unsaved changes, and Cancel keeps everything", async () => {
  const user = userEvent.setup();
  const { store } = await setup(`#p=${encodePlan(plan)}`);
  await user.click(await screen.findByRole("button", { name: "Open for editing" }));
  const dialog = screen.getByRole("dialog", { name: "Open “2027-C · Shared copy”?" });
  expect(dialog).toHaveTextContent("Your unsaved changes to the 2027-C schedule will be lost.");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(store.getState().temporaryPlan).not.toBeNull();
  expect(store.getState().courses).toEqual(["AB 1533"]);
});

it("opens the copy for editing after the warning and clears the link", async () => {
  const user = userEvent.setup();
  const { store } = await setup(`#schedule&p=${encodePlan(plan)}`);
  await user.click(await screen.findByRole("button", { name: "Open for editing" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Open plan" }));
  await waitFor(() => expect(store.getState().courses).toEqual(plan.courses));
  expect(store.getState().temporaryPlan).toBeNull();
  expect(store.getState().savedPlanId).toBeNull();
  expect(window.location.hash).toBe("#schedule");
  expect(screen.queryByRole("region", { name: "Shared plan" })).not.toBeInTheDocument();
  expect(getPlansSource().getSnapshot().current[plan.termId]).toBe(getPlansSource().getSnapshot().plans[0].id);
});

const changed = { ...plan, courses: ["CS 2022", ...plan.courses], chosen: { "CS 2022": ["CS 2022-CL02"], "AE 2320": ["AE 2320-CL01", "AE 2320-CL02"], "AE 2410": ["AE 2410-C01"] }, locks: {} };

it("stops to say what's missing, keeps the viewer's draft and offers the rest", async () => {
  const user = userEvent.setup();
  const { store } = await setup(`#p=${encodePlan(changed)}`);
  const dialog = await screen.findByRole("dialog", { name: "This plan needs a fresh look" });
  expect(dialog).toHaveTextContent("The original choices are preserved");
  expect(dialog).toHaveTextContent("AE 2320 · CL02");
  expect(dialog).toHaveTextContent("CS 2022");
  await user.click(within(dialog).getByRole("button", { name: "Review a copy" }));
  await screen.findByRole("region", { name: "Shared plan" });
  expect(screen.getByText("CS 2022 is no longer offered.")).toBeVisible();
  expect(screen.getByText("AE 2320 CL02 is no longer offered.")).toBeVisible();
  expect(selectViewedSchedule(store.getState())?.map((course) => [course.code, course.sections.map((section) => section.id)])).toEqual([["AE 2320", ["AE 2320-CL01"]], ["AE 2410", ["AE 2410-C01"]]]);
  expect(store.getState().savedSelectedCourse).toBe("AE 2320");
  const copy = await saveCopy(user);
  expect(copy.courses).toEqual(plan.courses);
  expect(copy.schedule.map((course) => course.code)).toEqual(plan.courses);
});

it("can close from the missing-section screen", async () => {
  const user = userEvent.setup();
  const { store } = await setup(`#p=${encodePlan(changed)}`);
  await user.click(within(await screen.findByRole("dialog", { name: "This plan needs a fresh look" })).getByRole("button", { name: "Close preview" }));
  await waitFor(() => expect(store.getState().temporaryPlan).toBeNull());
  expect(window.location.hash).toBe("");
});

it("can't save a copy when nothing in the plan is still offered", async () => {
  const user = userEvent.setup();
  await setup(`#p=${encodePlan({ ...plan, courses: ["CS 2022"], chosen: { "CS 2022": ["CS 2022-CL02"] }, locks: {}, professorByCourse: {} })}`);
  await user.click(await screen.findByRole("button", { name: "Review a copy" }));
  expect(await screen.findByRole("button", { name: "Save a copy" })).toBeDisabled();
  expect(screen.getByText("CS 2022 is no longer offered.")).toBeVisible();
});
