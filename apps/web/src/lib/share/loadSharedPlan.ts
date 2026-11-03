import { loadTerm, loadTermIndex } from "@/lib/data/load";
import { buildSharedPlan } from "./buildSharedPlan";
import { decodePlan, type DecodeResult } from "./codec";

type Failure = Extract<DecodeResult, { ok: false }> | { ok: false; reason: "unpublishedTerm" | "loadFailed" };
export type LoadSharedResult = { ok: true; plan: ReturnType<typeof buildSharedPlan> } | Failure;

export async function loadSharedPlan(encoded: string, deps = { loadTermIndex, loadTerm }): Promise<LoadSharedResult> {
  const decoded = decodePlan(encoded);
  if (!decoded.ok) return decoded;
  try {
    const index = await deps.loadTermIndex();
    if (!index.terms.some((term) => term.id === decoded.plan.termId)) return { ok: false, reason: "unpublishedTerm" };
    const term = await deps.loadTerm(decoded.plan.termId);
    if (term.term.id !== decoded.plan.termId) return { ok: false, reason: "loadFailed" };
    return { ok: true, plan: buildSharedPlan(decoded.plan, term) };
  } catch {
    return { ok: false, reason: "loadFailed" };
  }
}
