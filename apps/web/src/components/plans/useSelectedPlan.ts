"use client";

import { useSearchParams } from "next/navigation";
import type { PlansSnapshot, SavedPlan } from "@/lib/plans";
import { usePlans } from "@/lib/plans/usePlans";

export interface SelectedPlan {
  /** The plan id in the address (/plans?plan=…), or null for the list of plans. */
  planId: string | null;
  plan: SavedPlan | null;
  /** null until the saved plans are read. */
  snapshot: PlansSnapshot | null;
}

/** The plan /plans shows. Needs a Suspense boundary above it, as it reads the address. */
export function useSelectedPlan(): SelectedPlan {
  const planId = useSearchParams().get("plan");
  const snapshot = usePlans();
  const plan = planId ? (snapshot?.plans.find((item) => item.id === planId) ?? null) : null;
  return { planId, plan, snapshot };
}
