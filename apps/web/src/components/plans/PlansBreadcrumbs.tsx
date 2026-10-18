"use client";

import { TermBreadcrumbs } from "@/components/courses/TermBreadcrumbs";
import { useSelectedPlan } from "./useSelectedPlan";

export function PlansBreadcrumbs() {
  const { plan } = useSelectedPlan();
  return <TermBreadcrumbs shownTerm={plan?.term} />;
}
