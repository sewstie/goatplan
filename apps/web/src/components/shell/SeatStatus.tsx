"use client";

import { useRef, useState } from "react";
import { Warning } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { selectReadOnlyPlan, usePlanner, usePlannerStore } from "@/lib/store";
import { seatAge, seatDate } from "./seatAge";
import { useCurrentMinute } from "./useCurrentMinute";

/**
 * How fresh the planner's seat counts are, and a reminder to check Workday. When live seats couldn't be
 * had it shows the daily file's date with Retry. A saved or shared plan keeps its own seats, so it says nothing there.
 */
export function SeatStatus({ className }: { className?: string }) {
  const store = usePlannerStore();
  const now = useCurrentMinute();
  const updatedAt = usePlanner((state) => state.seatsUpdatedAt);
  const failed = usePlanner((state) => state.seatRefresh === "failed");
  const refreshSeats = usePlanner((state) => state.refreshSeats);
  const planView = usePlanner(selectReadOnlyPlan);
  const [retrying, setRetrying] = useState(false);
  const status = useRef<HTMLParagraphElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  if (!updatedAt || !Number.isFinite(Date.parse(updatedAt)) || planView) return null;

  async function retry() {
    if (retrying) return;
    setRetrying(true);
    await refreshSeats();
    const worked = store.getState().seatRefresh !== "failed";
    setRetrying(false);
    if (worked && document.activeElement === retryButton.current) requestAnimationFrame(() => status.current?.focus());
  }

  return (
    <div className={cx("flex flex-col gap-y-2 text-8 leading-12 text-ink-muted", className)}>
      {failed || retrying ? (
        <div className="flex min-h-20 items-center gap-4 self-start rounded-pill bg-notice-warning pr-4 pl-8 font-600 whitespace-nowrap text-notice-warning-ink">
          <Warning aria-hidden className="size-13 shrink-0" />
          <p role="status" aria-label="Seat freshness" aria-atomic="true">
            Seats from <time dateTime={updatedAt}>{seatDate(updatedAt)}</time>
            <span className="sr-only">. Couldn’t get the latest seats.</span>
          </p>
          <span aria-hidden>·</span>
          <button
            ref={retryButton}
            type="button"
            aria-label="Retry getting the latest seats"
            aria-disabled={retrying}
            onClick={() => void retry()}
            className="cursor-pointer rounded-badge px-3 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : (
        <p ref={status} tabIndex={-1} role="status" aria-label="Seat freshness" aria-atomic="true" className="flex min-h-20 items-center rounded-badge outline-none">
          Seats updated <time dateTime={updatedAt} className="ml-4">{now === null ? "" : seatAge(updatedAt, now)}</time>
        </p>
      )}
      <p>Confirm in Workday before you register.</p>
    </div>
  );
}
