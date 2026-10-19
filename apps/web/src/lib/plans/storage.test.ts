import { describe, expect, it } from "vitest";
import {
  currentPlanKey,
  parsePlan,
  planKey,
  PLANS_STORAGE_PREFIX,
  PLANS_VERSION,
  readCurrentPlanIds,
  readPlans,
  removePlan,
  writeCurrentPlanId,
  writePlan,
  type PlanStorage,
} from "./storage";
import { designPlan, MemoryPlanStorage } from "./testing";

describe("plan storage", () => {
  it("keeps plans under their own prefix, apart from the planner drafts", () => {
    expect(planKey("abc")).toBe("goatplan:plans:v1:plan:abc");
    expect(currentPlanKey("2027-C")).toBe("goatplan:plans:v1:current:2027-C");
    expect(planKey("abc").startsWith(PLANS_STORAGE_PREFIX)).toBe(true);
  });

  it("reads back a written plan with its own copy of the sections", () => {
    const storage = new MemoryPlanStorage();
    const plan = designPlan();
    expect(writePlan(storage, plan)).toBe(true);
    expect(readPlans(storage)).toEqual([plan]);
    expect(JSON.parse(storage.getItem(planKey(plan.id))!)).toMatchObject({ version: PLANS_VERSION, id: plan.id });
  });

  it("lists the most recently saved plan first", () => {
    const storage = new MemoryPlanStorage();
    writePlan(storage, designPlan({ id: "old", savedAt: "2026-10-01T00:00:00.000Z" }));
    writePlan(storage, designPlan({ id: "new", savedAt: "2026-10-17T00:00:00.000Z" }));
    writePlan(storage, designPlan({ id: "mid", savedAt: "2026-10-09T00:00:00.000Z" }));
    expect(readPlans(storage).map((plan) => plan.id)).toEqual(["new", "mid", "old"]);
  });

  it("round-trips professor choices and reads plans saved before the picker filtered schedules", () => {
    const storage = new MemoryPlanStorage();
    const plan = designPlan({ professorByCourse: { "AE 2320": "Ye Lu", "AE 2410": null } });
    writePlan(storage, plan);
    expect(readPlans(storage)[0].professorByCourse).toEqual(plan.professorByCourse);
    expect(parsePlan({ version: 1, ...plan, professorByCourse: undefined })?.professorByCourse).toEqual({});
    expect(parsePlan({ version: 1, ...plan, professorByCourse: { "AE 2320": false } })).toBeNull();
  });

  it("skips broken, old and unrelated entries without losing the good ones", () => {
    const storage = new MemoryPlanStorage();
    writePlan(storage, designPlan());
    storage.setItem(planKey("broken"), "{not json");
    storage.setItem(planKey("old"), JSON.stringify({ ...designPlan({ id: "old" }), version: 0 }));
    storage.setItem(planKey("moved"), JSON.stringify({ version: PLANS_VERSION, ...designPlan({ id: "elsewhere" }) }));
    storage.setItem("goatplan:draft:v1:2027-C", JSON.stringify({ version: 1 }));
    expect(readPlans(storage).map((plan) => plan.id)).toEqual(["plan-1"]);
  });

  it("keeps the names of blocked times", () => {
    const good = { version: PLANS_VERSION, ...designPlan() };
    const blocked = [
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960, label: " " },
    ];
    expect(parsePlan({ ...good, preferences: { ...good.preferences, blocked } })?.preferences.blocked).toEqual([
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960 },
    ]);
    const unnamed = [{ day: "Tue", start: 840, end: 960, label: 4 }];
    expect(parsePlan({ ...good, preferences: { ...good.preferences, blocked: unnamed } })).toBeNull();
  });

  it("rejects plans with missing or wrong fields", () => {
    const good = { version: PLANS_VERSION, ...designPlan() };
    expect(parsePlan(good)).toEqual(designPlan());
    expect(parsePlan({ ...good, name: 3 })).toBeNull();
    expect(parsePlan({ ...good, sortPreset: "fastest" })).toBeNull();
    expect(parsePlan({ ...good, preferences: { ...good.preferences, startsAfter: 2000 } })).toBeNull();
    expect(parsePlan({ ...good, schedule: [{ code: "AE 2320", title: "", sections: [] }] })).toBeNull();
    expect(parsePlan({ ...good, schedule: [{ code: "AE 2320", title: "", sections: [{ id: "x" }] }] })).toBeNull();
    expect(parsePlan(null)).toBeNull();
  });

  it("removes a plan and forgets it as the current plan of its term", () => {
    const storage = new MemoryPlanStorage();
    writePlan(storage, designPlan({ id: "a" }));
    writePlan(storage, designPlan({ id: "b" }));
    writeCurrentPlanId(storage, "2027-C", "a");
    writeCurrentPlanId(storage, "2027-D", "b");
    removePlan(storage, "a");
    expect(readPlans(storage).map((plan) => plan.id)).toEqual(["b"]);
    expect(readCurrentPlanIds(storage)).toEqual({ "2027-D": "b" });
  });

  it("remembers and clears each term's current plan", () => {
    const storage = new MemoryPlanStorage();
    writeCurrentPlanId(storage, "2027-C", "a");
    writeCurrentPlanId(storage, "2027-D", "b");
    expect(readCurrentPlanIds(storage)).toEqual({ "2027-C": "a", "2027-D": "b" });
    writeCurrentPlanId(storage, "2027-C", null);
    expect(readCurrentPlanIds(storage)).toEqual({ "2027-D": "b" });
  });

  it("reports a plan that couldn't be stored and never throws", () => {
    const full: PlanStorage = Object.assign(new MemoryPlanStorage(), {
      setItem() {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    });
    expect(writePlan(full, designPlan())).toBe(false);
    expect(writePlan(null, designPlan())).toBe(false);
    expect(readPlans(null)).toEqual([]);
    expect(readCurrentPlanIds(null)).toEqual({});
    expect(() => removePlan(null, "a")).not.toThrow();
    expect(() => writeCurrentPlanId(full, "2027-C", "a")).not.toThrow();
  });
});
