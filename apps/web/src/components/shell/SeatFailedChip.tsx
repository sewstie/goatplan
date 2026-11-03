"use client";

import { useRef, useState } from "react";
import { Warning } from "@phosphor-icons/react/ssr";
import { selectReadOnlyPlan, usePlanner, usePlannerStore } from "@/lib/store";
import { SEAT_REFRESH_ID } from "./SeatFreshness";
import { seatDate } from "./seatAge";

/** "Seats from Oct 31 · Retry", only after a failed refresh. It stays up during a retry, so the button keeps focus until there's an answer. */
export function SeatFailedChip() {
  const store = usePlannerStore();
  const term = usePlanner((state) => state.term);
  const seatsUpdatedAt = usePlanner((state) => state.seatsUpdatedAt);
  const failed = usePlanner((state) => state.seatRefresh === "failed");
  const refresh = usePlanner((state) => state.refreshSeats);
  const planView = usePlanner(selectReadOnlyPlan);
  const [retrying, setRetrying] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const timestamp = seatsUpdatedAt ?? term?.generatedAt;

  if ((!failed && !retrying) || !timestamp || !Number.isFinite(Date.parse(timestamp)) || (planView && planView.id !== "__temporary__")) return null;

  async function retry() {
    if (retrying) return;
    setRetrying(true);
    await refresh();
    const stillHere = store.getState().seatRefresh === "failed";
    if (!stillHere && document.activeElement === button.current) document.getElementById(SEAT_REFRESH_ID)?.focus();
    setRetrying(false);
  }

  return (
    <div className="flex min-h-24 shrink-0 items-center gap-4 rounded-pill bg-notice-warning pr-4 pl-8 text-8 leading-12 font-600 whitespace-nowrap text-notice-warning-ink">
      <Warning aria-hidden className="size-13 shrink-0" />
      <p>Seats from <time dateTime={timestamp}>{seatDate(timestamp)}</time></p>
      <span aria-hidden>·</span>
      <button
        ref={button}
        type="button"
        aria-label="Retry refreshing seats"
        aria-disabled={retrying}
        onClick={() => void retry()}
        className="cursor-pointer rounded-badge px-3 py-2 underline underline-offset-2"
      >
        Retry
      </button>
    </div>
  );
}
