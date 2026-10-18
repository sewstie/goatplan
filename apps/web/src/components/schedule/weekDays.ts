import { WEEK } from "@/lib/data/days";
import type { Day } from "@/lib/data/types";

const WEEKDAYS: readonly Day[] = WEEK.slice(0, 5);

/** Monday–Friday, or the whole week when anything falls on a weekend (div.app-17.md). */
export function visibleDays(items: readonly { day: Day }[]): readonly Day[] {
  return items.some((item) => item.day === "Sat" || item.day === "Sun") ? WEEK : WEEKDAYS;
}
