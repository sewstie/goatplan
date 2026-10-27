"use client";

import { Sidebar } from "@/components/shell/Sidebar";
import { PlansSidebar } from "./PlansSidebar";
import { useSelectedPlan } from "./useSelectedPlan";

/** Wraps PlansSidebar inside a Sidebar that knows the selected plan's term for the DataUpdated line. */
export function PlansSidebarWrapper() {
  const { plan } = useSelectedPlan();
  return (
    <Sidebar termId={plan?.termId}>
      <PlansSidebar />
    </Sidebar>
  );
}
