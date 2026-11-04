import { describe, expect, it, vi } from "vitest";
import type { TermFile, TermIndex } from "@/lib/data/types";
import { emptyDraft, draftKey, LAST_TERM_KEY } from "@/lib/store/draft";
import { MemoryPlanStorage } from "@/lib/plans/testing";
import { createOpenPlan, isPlanKey } from "./openPlan";

const NOW = new Date("2026-11-01T12:00:00Z");
const term = (id: string, start: string, end: string) => ({ id, name: id, start, end, courseCount: 2 });
const index = { terms: [term("2026-A", "2026-08-20", "2026-10-10"), term("2027-C", "2027-01-10", "2027-03-01"), term("2027-D", "2027-03-10", "2027-05-01")] } as unknown as TermIndex;

const termFile = { courses: [{ code: "WPE 1001", credits: 1 }, { code: "CS 2102", credits: 3 }, { code: "CS 3043", credits: null }] } as unknown as TermFile;

function setup(lastTerm: string | null, drafts: Record<string, string[]> = {}, loaders: Partial<Parameters<typeof createOpenPlan>[0]> = {}) {
  const storage = new MemoryPlanStorage();
  if (lastTerm) storage.setItem(LAST_TERM_KEY, lastTerm);
  for (const [id, courses] of Object.entries(drafts)) {
    storage.setItem(draftKey(id), JSON.stringify({ version: 1, ...emptyDraft(), courses }));
  }
  const loadTerm = vi.fn(async () => termFile);
  const plan = createOpenPlan({ getStorage: () => storage, loadTermIndex: async () => index, loadTerm, now: () => NOW, ...loaders });
  return { storage, plan, loadTerm };
}

describe("the open term's plan", () => {
  it("reads the current plan of the open term with credits from the term file", async () => {
    const { plan, loadTerm } = setup("2027-C", { "2027-C": ["CS 2102", "WPE 1001"] });
    expect(await plan.read()).toEqual([{ code: "CS 2102", credits: 3 }, { code: "WPE 1001", credits: 1 }]);
    expect(loadTerm).toHaveBeenCalledWith("2027-C");
  });

  it("leaves out plans for other terms", async () => {
    const { plan } = setup("2027-C", { "2027-D": ["CS 2102"] });
    expect(await plan.read()).toEqual([]);
  });

  it("is empty before the student has opened a plan", async () => {
    const { plan, loadTerm } = setup(null);
    expect(await plan.read()).toEqual([]);
    expect(loadTerm).not.toHaveBeenCalled();
  });

  it("doesn't count a plan from a term that has closed", async () => {
    const { plan } = setup("2026-A", { "2026-A": ["CS 2102"] });
    expect(await plan.read()).toEqual([]);
  });

  it("drops a course the term no longer has, the same way the planner does", async () => {
    const { plan } = setup("2027-C", { "2027-C": ["CS 2102", "CS 1005"] });
    expect(await plan.read()).toEqual([{ code: "CS 2102", credits: 3 }]);
  });

  it("counts a course with no credits listed at 3", async () => {
    const { plan } = setup("2027-C", { "2027-C": ["CS 3043"] });
    expect(await plan.read()).toEqual([{ code: "CS 3043", credits: 3 }]);
  });

  it("still counts the plan at 3 credits each when the term file can't load", async () => {
    const { plan } = setup("2027-C", { "2027-C": ["WPE 1001"] }, { loadTerm: async () => { throw new Error("offline"); } });
    expect(await plan.read()).toEqual([{ code: "WPE 1001", credits: 3 }]);
  });

  it("falls back on the last term when the term list can't load", async () => {
    const { plan } = setup("2027-C", { "2027-C": ["CS 2102"] }, { loadTermIndex: async () => { throw new Error("offline"); } });
    expect(await plan.read()).toEqual([{ code: "CS 2102", credits: 3 }]);
  });

  it("is empty for a broken draft", async () => {
    const { plan, storage } = setup("2027-C");
    storage.setItem(draftKey("2027-C"), "{not json");
    expect(await plan.read()).toEqual([]);
  });

  it("changes its signature when the plan or the open term changes, and only then", () => {
    const { plan, storage } = setup("2027-C", { "2027-C": ["CS 2102"], "2027-D": ["CS 3043"] });
    const first = plan.signature();
    expect(plan.signature()).toBe(first);
    storage.setItem(draftKey("2027-C"), JSON.stringify({ version: 1, ...emptyDraft(), courses: [] }));
    const second = plan.signature();
    expect(second).not.toBe(first);
    storage.setItem(LAST_TERM_KEY, "2027-D");
    expect(plan.signature()).not.toBe(second);
  });
});

describe("isPlanKey", () => {
  it("knows the plan's storage keys", () => {
    expect(isPlanKey(LAST_TERM_KEY)).toBe(true);
    expect(isPlanKey(draftKey("2027-C"))).toBe(true);
    expect(isPlanKey("goatplan:plans:v1:plan:1")).toBe(false);
    expect(isPlanKey("goatplan:history:v1")).toBe(false);
  });
});
