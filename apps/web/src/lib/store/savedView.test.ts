import { describe, expect, it } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { createPlannerStore } from "./createPlannerStore";
import { draftKey, readDraft } from "./draft";
import { selectViewedSchedule } from "./viewSelectors";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "./testing/fixtures";

async function setup() {
  const storage = new MemoryStorage();
  const store = createPlannerStore({
    storage,
    engine: { loadTerm: async (id) => loaded(id), solve: async (request) => solved(request) },
    loadTermIndex: async () => ({ terms: [termSummary("2027-C"), termSummary("2027-D")] }),
    loadTerm: async (id) => termFile(id),
    takeTermBuffer: () => null,
    now: () => new Date("2026-10-17T12:00:00Z"),
  });
  await store.getState().init();
  store.getState().addCourse("AE 2320");
  await store.getState().retrySolve();
  return { store, storage, state: () => store.getState() };
}

describe("saved view", () => {
  it("falls back to Found for an empty term or a deleted plan", async () => {
    const { state } = await setup();
    state().showSaved("missing");
    expect(state().savedPlanId).toBeNull();
    state().setSavedPlans([designPlan()]);
    state().showSaved();
    state().setSavedPlans([]);
    expect(state().savedPlanId).toBeNull();
    state().setSavedPlans([designPlan()]);
    state().showSaved();
    await state().setTerm("2027-D");
    state().showSaved();
    expect(state().savedPlanId).toBeNull();
  });
  it("blocks draft edits and found paging while viewing a saved plan", async () => {
    const { state, storage } = await setup();
    const plan = designPlan();
    state().setSavedPlans([plan]);
    const before = readDraft(storage, "2027-C");
    const response = state().response;
    state().showSaved();
    state().addCourse("AE 2410");
    state().removeCourse("AE 2320");
    state().setPreferences({ startsAfter: 900 });
    state().setProfessor("AE 2320", "Ye Lu");
    state().lockSection("AE 2320", "AE 2320-CX02");
    state().unlockSection("AE 2320", "AE 2320-CX02");
    state().setSortPreset("fewestDays");
    state().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    state().pickOption("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    state().nextSchedule();
    await state().retrySolve();
    expect(state().response).toBe(response);
    expect(state().scheduleIndex).toBe(0);
    expect(state().courses).toEqual(["AE 2320"]);
    expect(state().preferences).toEqual(before?.preferences);
    expect(readDraft(storage, "2027-C")).toEqual(before);
  });
  it("selects the saved snapshot and restores found sections, alternatives, and selection on return", async () => {
    const { state } = await setup();
    state().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    state().selectCourse("AE 2320", "AE 2320-CX02");
    const found = selectViewedSchedule(state());
    expect(found?.[0].sections.map((section) => section.id)).toEqual(["AE 2320-CL01", "AE 2320-CX02"]);
    const plan = designPlan();
    state().setSavedPlans([plan]);
    state().showSaved(plan.id);
    expect(selectViewedSchedule(state())).toBe(plan.schedule);
    state().selectCourse("AE 2410", "AE 2410-C01");
    state().showFound();
    expect(selectViewedSchedule(state())).toEqual(found);
    expect(state().selectedCourse).toBe("AE 2320");
    expect(state().selectedSection).toBe("AE 2320-CX02");
  });
  it("browses this term's saved plans without replacing or persisting over the draft", async () => {
    const { state, storage } = await setup();
    const before = readDraft(storage, "2027-C");
    const found = state().response;
    const first = designPlan();
    const second = designPlan({ id: "second", name: "Later classes" });
    state().setSavedPlans([first, designPlan({ id: "other-term", termId: "2027-D" }), second]);
    state().showSaved();
    expect(state().savedPlanId).toBe(first.id);
    state().previousSavedPlan();
    expect(state().savedPlanId).toBe(first.id);
    state().nextSavedPlan();
    state().nextSavedPlan();
    expect(state().savedPlanId).toBe(second.id);
    state().showFound();
    expect(state().savedPlanId).toBeNull();
    expect(state().response).toBe(found);
    expect(readDraft(storage, "2027-C")).toEqual(before);
    expect(JSON.parse(storage.getItem(draftKey("2027-C"))!)).not.toHaveProperty("savedPlanId");
  });
});
