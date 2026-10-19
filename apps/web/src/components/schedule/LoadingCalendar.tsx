import { WEEK } from "@/lib/data/days";
import { LoadingBlocks } from "./LoadingBlocks";
import { DEFAULT_RANGE } from "./timeRange";
import { WeekCalendar } from "./WeekCalendar";

/** While the term file loads (div.app-1.md). */
export function LoadingCalendar({ caption = "Awaiting term data" }: { caption?: string }) {
  return (
    <WeekCalendar
      busy
      days={WEEK.slice(0, 5)}
      range={DEFAULT_RANGE}
      caption={caption}
      renderDay={(day) => <LoadingBlocks day={day} />}
    />
  );
}
