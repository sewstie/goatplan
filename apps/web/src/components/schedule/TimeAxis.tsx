import { formatTimeShort } from "@/lib/data/time";
import { percentOf, type TimeRange } from "./timeRange";

export function TimeAxis({ range, marks }: { range: TimeRange; marks: readonly number[] }) {
  return (
    <div aria-hidden className="relative w-(--size-time-axis) shrink-0">
      {marks.map((minute) => (
        <span
          key={minute}
          className="absolute right-7 -translate-y-1/2 text-8-5 leading-12-33 whitespace-nowrap text-ink-muted motion-safe:transition-[top] motion-safe:duration-180"
          style={{ top: `${percentOf(range, minute)}%` }}
        >
          {formatTimeShort(minute)}
        </span>
      ))}
    </div>
  );
}
