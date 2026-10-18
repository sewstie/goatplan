import { formatTime } from "@/lib/data/time";
import { percentOf, type TimeRange } from "./timeRange";

/** The hatched band across every day before the start-time preference (div.app-3.md). */
export function EarlyBand({ range, startsAfter }: { range: TimeRange; startsAfter: number }) {
  if (startsAfter <= range.start) return null;
  const height = percentOf(range, Math.min(startsAfter, range.end));
  return (
    <div
      className="absolute inset-x-3 top-0 overflow-hidden rounded-block border border-line-disabled bg-hatch pt-6 text-center text-8 leading-11-6 text-ink-hatch"
      style={{ height: `${height}%` }}
    >
      No classes before {formatTime(startsAfter)}
    </div>
  );
}
