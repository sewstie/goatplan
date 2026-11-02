"use client";

import { useSyncExternalStore } from "react";
import { ArrowClockwise, CheckCircle, Info } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { seatAge } from "./seatAge";

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverMinute = () => null;

/** "Seats updated 2 min ago", right above the preferences. It says so while refreshing and after a failed refresh. */
export function SeatStatus() {
  const now = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  const term = usePlanner((state) => state.term);
  const seatsUpdatedAt = usePlanner((state) => state.seatsUpdatedAt);
  const refresh = usePlanner((state) => state.seatRefresh);
  const planView = usePlanner(selectReadOnlyPlan);
  const timestamp = seatsUpdatedAt ?? term?.generatedAt;
  if (!timestamp || !Number.isFinite(Date.parse(timestamp)) || (planView && planView.id !== "__temporary__")) return <div className="min-h-18" />;
  const age = now === null ? "" : seatAge(timestamp, now);
  const failed = refresh === "failed";

  return (
    <div className={cx("flex min-h-18 shrink-0 items-center justify-start gap-6 text-8 leading-12 tablet:justify-end", failed ? "text-notice-warning-ink" : "text-ink-muted")}>
      {refresh === "refreshing" ? <ArrowClockwise aria-hidden className="size-14 shrink-0" /> : failed ? <Info aria-hidden className="size-14 shrink-0" /> : <CheckCircle aria-hidden className="size-14 shrink-0" />}
      <p role="status" aria-label="Seat freshness" aria-atomic="true">
        {refresh === "refreshing" ? (
          <>
            Refreshing seats… <span className="pl-6">Last updated <time dateTime={timestamp}>{age}</time></span>
          </>
        ) : (
          <>
            Seats updated <time dateTime={timestamp}>{age}</time>
          </>
        )}
      </p>
    </div>
  );
}
