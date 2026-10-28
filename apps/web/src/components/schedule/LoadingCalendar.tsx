"use client";

import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { WEEK } from "@/lib/data/days";
import { LoadingBlocks } from "./LoadingBlocks";
import { PhoneLoadingBlocks } from "./PhoneLoadingBlocks";
import { DEFAULT_RANGE } from "./timeRange";
import { WeekCalendar } from "./WeekCalendar";

/** While the term file loads (div.app-1.md). The phone gets its own blocks, shaped like its class blocks. */
export function LoadingCalendar({ caption = "Awaiting term data" }: { caption?: string }) {
  const phone = usePhoneViewport();
  return (
    <WeekCalendar
      busy
      days={WEEK.slice(0, 5)}
      range={DEFAULT_RANGE}
      caption={caption}
      renderDay={(day) => (phone ? <PhoneLoadingBlocks day={day} /> : <LoadingBlocks day={day} />)}
    />
  );
}
