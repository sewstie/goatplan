"use client";

import { ArrowClockwise } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { seatAge } from "./seatAge";
import { useCurrentMinute } from "./useCurrentMinute";

export const SEAT_REFRESH_ID = "seat-refresh";

/** "Seats 5 min ago ⟳" in the sidebar footer. A saved plan's seats aren't live, so it says nothing there. */
export function SeatFreshness() {
  const now = useCurrentMinute();
  const term = usePlanner((state) => state.term);
  const seatsUpdatedAt = usePlanner((state) => state.seatsUpdatedAt);
  const status = usePlanner((state) => state.seatRefresh);
  const refresh = usePlanner((state) => state.refreshSeats);
  const planView = usePlanner(selectReadOnlyPlan);
  const timestamp = seatsUpdatedAt ?? term?.generatedAt;
  if (!timestamp || !Number.isFinite(Date.parse(timestamp)) || (planView && planView.id !== "__temporary__")) return null;
  const refreshing = status === "refreshing";

  return (
    <>
      <span aria-hidden>·</span>
      <p role="status" aria-label="Seat freshness" aria-atomic="true">
        {refreshing ? (
          <>Refreshing<span className="sr-only"> seats</span>…</>
        ) : (
          <>Seats <time dateTime={timestamp}>{now === null ? "" : seatAge(timestamp, now)}</time></>
        )}
        {status === "failed" && <span className="sr-only">. Couldn’t refresh seats. Check Workday before registering.</span>}
      </p>
      <button
        id={SEAT_REFRESH_ID}
        type="button"
        aria-label="Refresh seats"
        aria-disabled={refreshing}
        onClick={() => {
          if (!refreshing) void refresh();
        }}
        className="flex size-24 shrink-0 cursor-pointer items-center justify-center rounded-badge hover:bg-surface-selected hover:text-ink"
      >
        <ArrowClockwise aria-hidden className={cx("size-13", refreshing && "motion-safe:animate-spin")} />
      </button>
    </>
  );
}
