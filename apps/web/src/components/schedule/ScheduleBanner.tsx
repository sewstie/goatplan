"use client";

import { selectSchedules, usePlanner } from "@/lib/store";
import { Banner } from "./Banner";
import { bannerMessage } from "./scheduleCopy";
import { useDelayedFlag } from "./useDelayedFlag";
import { useScheduleItems } from "./useScheduleItems";
import { useDiagnosis } from "./useDiagnosis";

/** How long the engine may work before the banner says it's still looking. */
const SLOW_SOLVE_MS = 600;

/** Schedule agent: the full-width warning or info banner (div.app-7.md, div.app-15.md). Renders nothing when there's no message. */
export function ScheduleBanner() {
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
  const drawing = usePlanner((state) => state.drawing);

  if (saved || termStatus !== "ready") return null;
  const message = bannerMessage({ courseCount, solveStatus, slow, solveError, response, shownSchedules, waitlisted });
  const banner = diagnosis?.issues[0] ? <Banner message={{ tone: "warning", ...diagnosis.issues[0].banner }} /> : message && <Banner message={message} />;
  if (!drawing) return banner;
  // Drawing keeps the grid still between drags, so the message is only announced. The summary line above says it too.
  return banner && <div className="sr-only">{banner}</div>;
}
