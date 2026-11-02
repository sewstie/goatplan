"use client";

import { selectSchedules, usePlanner } from "@/lib/store";
import { bannerMessage, type BannerMessage } from "./scheduleCopy";
import { useDelayedFlag } from "./useDelayedFlag";
import { useDiagnosis } from "./useDiagnosis";
import { useScheduleItems } from "./useScheduleItems";

const SLOW_SOLVE_MS = 600;

export function useScheduleMessage(): BannerMessage | null {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const termStatus = usePlanner((state) => state.termStatus);
  const courseCount = usePlanner((state) => state.courses.length);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const solveError = usePlanner((state) => state.solveError);
  const response = usePlanner((state) => state.response);
  const shownSchedules = usePlanner((state) => selectSchedules(state).length);
  const { waitlisted } = useScheduleItems();
  const diagnosis = useDiagnosis();
  const slow = useDelayedFlag(solveStatus === "waiting" || solveStatus === "solving", SLOW_SOLVE_MS);

  if (saved || termStatus !== "ready") return null;
  if (diagnosis?.issues[0]) return { tone: "warning", ...diagnosis.issues[0].banner };
  return bannerMessage({ courseCount, solveStatus, slow, solveError, response, shownSchedules, waitlisted });
}
