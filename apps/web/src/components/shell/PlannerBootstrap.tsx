"use client";

import { useEffect } from "react";
import { SEAT_POLL_MS } from "@/lib/data/loadSeats";
import { getPlannerStore, usePlanner } from "@/lib/store";

/** Starts the planner store in the browser. The hidden element exposes its status to tests and devtools. */
export function PlannerBootstrap() {
  const termId = usePlanner((state) => state.termId);
  const termStatus = usePlanner((state) => state.termStatus);
  const solveStatus = usePlanner((state) => state.solveStatus);

  useEffect(() => {
    void getPlannerStore().getState().init();
    const refresh = () => {
      if (document.visibilityState === "visible") void getPlannerStore().getState().refreshSeats();
    };
    const timer = setInterval(refresh, SEAT_POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
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
