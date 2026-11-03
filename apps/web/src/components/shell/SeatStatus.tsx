"use client";

import { useSyncExternalStore } from "react";
import { ArrowClockwise, CheckCircle, Info } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { selectReadOnlyPlan, usePlanner, usePlannerStore } from "@/lib/store";
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
  const refreshSeats = usePlanner((state) => state.refreshSeats);
  const planView = usePlanner(selectReadOnlyPlan);
  const [retrying, setRetrying] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const timestamp = seatsUpdatedAt ?? term?.generatedAt;
  if (!timestamp || !Number.isFinite(Date.parse(timestamp)) || (planView && planView.id !== "__temporary__")) return <div className="min-h-18" />;
  const age = now === null ? "" : seatAge(timestamp, now);
  const failed = refresh === "failed";

  async function retry() {
    if (retrying) return;
    setRetrying(true);
    await refreshSeats();
    const worked = store.getState().seatRefresh !== "failed";
    if (worked && document.activeElement === button.current) status.current?.focus();
    setRetrying(false);
  }

  return (
    <div className={cx("flex min-h-18 shrink-0 items-center justify-start gap-6 text-8 leading-12 tablet:justify-end", failed ? "text-notice-warning-ink" : "text-ink-muted")}>
      {refresh === "refreshing" ? <ArrowClockwise aria-hidden className="size-14 shrink-0" /> : failed ? <Info aria-hidden className="size-14 shrink-0" /> : <CheckCircle aria-hidden className="size-14 shrink-0" />}
      <p ref={status} tabIndex={-1} role="status" aria-label="Seat freshness" aria-atomic="true" className="outline-none">
        {refresh === "refreshing" ? (
          <>
            Refreshing seats… <span className="pl-6">Last updated <time dateTime={timestamp}>{age}</time></span>
          </>
        ) : (
          <>
            Seats updated <time dateTime={timestamp}>{age}</time>
          </>
        )}
        {failed && <span className="sr-only">. Couldn’t refresh seats. Check Workday before registering.</span>}
      </p>
      {(failed || retrying) && (
        <>
          <span aria-hidden>·</span>
          <button
            ref={button}
            type="button"
            aria-label="Retry refreshing seats"
            aria-disabled={retrying}
            onClick={() => void retry()}
            className="relative cursor-pointer rounded-badge px-3 font-600 underline underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-13"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
