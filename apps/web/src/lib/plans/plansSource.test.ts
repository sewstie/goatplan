import { describe, expect, it, vi } from "vitest";
import { createPlansSource } from "./plansSource";
import { planKey, PLANS_VERSION } from "./storage";
import { designPlan, MemoryPlanStorage } from "./testing";

describe("createPlansSource", () => {
  it("keeps the same snapshot until something changes", () => {
    const storage = new MemoryPlanStorage();
    const source = createPlansSource(() => storage);
    const first = source.getSnapshot();
    expect(source.getSnapshot()).toBe(first);
    source.save(designPlan());
    expect(source.getSnapshot()).not.toBe(first);
    expect(source.getSnapshot().plans).toHaveLength(1);
  });

  it("saves, renames, links and removes plans, telling listeners each time", () => {
    const storage = new MemoryPlanStorage();
    const source = createPlansSource(() => storage);
    const listener = vi.fn();
    source.subscribe(listener);

    expect(source.save(designPlan())).toBe(true);
    source.setCurrent("2027-C", "plan-1");
    expect(source.rename("plan-1", "Mornings free")).toBe(true);
    expect(source.getSnapshot()).toMatchObject({ plans: [{ name: "Mornings free" }], current: { "2027-C": "plan-1" } });

    source.remove("plan-1");
    expect(source.getSnapshot()).toEqual({ plans: [], current: {} });
    expect(source.rename("plan-1", "Gone")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("picks up plans saved in another tab", () => {
    const storage = new MemoryPlanStorage();
    const source = createPlansSource(() => storage);
    const listener = vi.fn();
    const unsubscribe = source.subscribe(listener);
    expect(source.getSnapshot().plans).toEqual([]);

    storage.setItem(planKey("plan-1"), JSON.stringify({ version: PLANS_VERSION, ...designPlan() }));
    window.dispatchEvent(new StorageEvent("storage", { key: "goatplan:draft:v1:2027-C" }));
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent("storage", { key: planKey("plan-1") }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(source.getSnapshot().plans).toHaveLength(1);

    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
