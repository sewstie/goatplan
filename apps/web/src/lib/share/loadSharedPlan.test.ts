import { expect, it, vi } from "vitest";
import { termFile, termSummary } from "@/lib/store/testing/fixtures";
import { encodePlan } from "./codec";
import { loadSharedPlan } from "./loadSharedPlan";
import { plan } from "./testing";

it("rejects an unpublished term without fetching its file", async () => {
  const loadTerm = vi.fn();
  expect(await loadSharedPlan(encodePlan(plan), { loadTermIndex: async () => ({ terms: [] }), loadTerm })).toEqual({ ok: false, reason: "unpublishedTerm" });
  expect(loadTerm).not.toHaveBeenCalled();
});

it("builds a temporary plan from the published term and handles a failed fetch", async () => {
  const deps = { loadTermIndex: async () => ({ terms: [termSummary(plan.termId)] }), loadTerm: async () => termFile(plan.termId) };
  expect(await loadSharedPlan(encodePlan(plan), deps)).toMatchObject({ ok: true, plan: { view: { termId: plan.termId } } });
  expect(await loadSharedPlan(encodePlan(plan), { ...deps, loadTerm: async () => { throw new Error("offline"); } })).toEqual({ ok: false, reason: "loadFailed" });
});
