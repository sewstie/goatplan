"use client";

import { ArrowClockwise, Warning } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { seatAge, seatDate } from "./seatAge";
import { useCurrentMinute } from "./useCurrentMinute";

export function SeatChip() {
  const now = useCurrentMinute();
  const term = usePlanner((state) => state.term);
  const seatsUpdatedAt = usePlanner((state) => state.seatsUpdatedAt);
  const status = usePlanner((state) => state.seatRefresh);
  const refresh = usePlanner((state) => state.refreshSeats);
  const planView = usePlanner(selectReadOnlyPlan);
  const timestamp = seatsUpdatedAt ?? term?.generatedAt;
  if (!timestamp || !Number.isFinite(Date.parse(timestamp)) || (planView && planView.id !== "__temporary__")) return null;
  const failed = status === "failed";
  const refreshing = status === "refreshing";

  return (
    <div className={cx("flex min-h-28 shrink-0 items-center gap-4 rounded-pill text-8 leading-12 whitespace-nowrap", failed ? "bg-notice-warning pr-4 pl-8 font-600 text-notice-warning-ink" : "text-ink-muted")}>
      {failed && <Warning aria-hidden className="size-13 shrink-0" />}
      <p role="status" aria-label="Seat freshness" aria-atomic="true">
        {failed ? (
          <>Seats from <time dateTime={timestamp}>{seatDate(timestamp)}</time><span className="sr-only">. Couldn’t refresh seats. Check Workday before registering.</span></>
        ) : refreshing ? (
          "Refreshing seats…"
        ) : (
          <>Seats <time dateTime={timestamp}>{now === null ? "" : seatAge(timestamp, now)}</time></>
        )}
      </p>
      {failed && <span aria-hidden>·</span>}
      {/* One button in every state, so it keeps focus through a refresh. */}
      <button
        type="button"
        aria-label={failed ? "Retry refreshing seats" : "Refresh seats"}
        aria-disabled={refreshing}
        onClick={() => {
          if (!refreshing) void refresh();
        }}
        className={failed ? "cursor-pointer rounded-badge px-3 py-2 underline underline-offset-2" : "flex size-24 cursor-pointer items-center justify-center rounded-badge hover:bg-surface-selected hover:text-ink"}
      >
        {failed ? "Retry" : <ArrowClockwise aria-hidden className={cx("size-13", refreshing && "motion-safe:animate-spin")} />}
      </button>
    </div>
  );
}
