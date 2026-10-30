"use client";

import { selectSchedules, usePlanner } from "@/lib/store";
import { Banner } from "./Banner";
import { bannerMessage, type BannerMessage } from "./scheduleCopy";
import { useDelayedFlag } from "./useDelayedFlag";
import { useScheduleItems } from "./useScheduleItems";
import { useDiagnosis } from "./useDiagnosis";
import { useHeldHeight } from "./useHeldHeight";

const DRAWING_TIP: BannerMessage = { tone: "info", title: "Tip:", detail: "Start a drag on a blocked time to erase it." };

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
  const [heldRef, heldStyle] = useHeldHeight<HTMLDivElement>(drawing);

  if (saved || termStatus !== "ready") return null;
  const message = bannerMessage({ courseCount, solveStatus, slow, solveError, response, shownSchedules, waitlisted });
  const banner = diagnosis?.issues[0] ? <Banner message={{ tone: "warning", ...diagnosis.issues[0].banner }} /> : message && <Banner message={message} />;
  if (!drawing) return banner;
  // In drawing mode the banner's place is always taken, by a tip when there's nothing else to say, so
  // "No schedule fits" can't push the calendar down.
  return (
    <div ref={heldRef} style={heldStyle} className="grid">
      {banner || <Banner message={DRAWING_TIP} />}
    </div>
  );
}
