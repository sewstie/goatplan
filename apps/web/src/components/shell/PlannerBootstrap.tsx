"use client";

import { useEffect } from "react";
import { getPlannerStore, usePlanner } from "@/lib/store";

/** Starts the planner store in the browser. The hidden element exposes its status to tests and devtools. */
export function PlannerBootstrap() {
  const termId = usePlanner((state) => state.termId);
  const termStatus = usePlanner((state) => state.termStatus);
  const solveStatus = usePlanner((state) => state.solveStatus);

  useEffect(() => {
    void getPlannerStore().getState().init();
  }, []);

  return (
    <span
      hidden
      data-planner-term={termId ?? ""}
      data-planner-term-status={termStatus}
      data-planner-solve-status={solveStatus}
    />
  );
}
