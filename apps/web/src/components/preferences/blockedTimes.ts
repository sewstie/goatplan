import { formatDays, formatTimeRange, WEEK } from "@/lib/data";
import type { Day } from "@/lib/data/types";
import type { BlockedTime } from "@/lib/engine/types";

/** Blocked times that share a start and end, shown as one pill: "Tue, Fri 2 PM–4 PM". */
export interface BlockedGroup {
  start: number;
  end: number;
  days: Day[];
}

const sameRange = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start === b.start && a.end === b.end;

const byWeekOrder = (a: Day, b: Day) => WEEK.indexOf(a) - WEEK.indexOf(b);

/** Groups in the order they were first added, days in week order. */
export function groupBlocked(blocked: readonly BlockedTime[]): BlockedGroup[] {
  const groups: BlockedGroup[] = [];
  for (const time of blocked) {
    const group = groups.find((item) => sameRange(item, time));
    if (!group) groups.push({ start: time.start, end: time.end, days: [time.day] });
    else if (!group.days.includes(time.day)) group.days.push(time.day);
  }
  return groups.map((group) => ({ ...group, days: group.days.sort(byWeekOrder) }));
}

export function groupDays(group: BlockedGroup): string {
  return formatDays(group.days);
}

export function groupTimes(group: BlockedGroup): string {
  return formatTimeRange(group.start, group.end, "short");
}

/** Adds the range on each day, skipping days that already have exactly that range. */
export function addBlocked(blocked: readonly BlockedTime[], days: readonly Day[], start: number, end: number): BlockedTime[] {
  const added = [...new Set(days)]
    .sort(byWeekOrder)
    .filter((day) => !blocked.some((time) => time.day === day && sameRange(time, { start, end })))
    .map((day) => ({ day, start, end }));
  return [...blocked, ...added];
}

export function removeGroup(blocked: readonly BlockedTime[], group: BlockedGroup): BlockedTime[] {
  return blocked.filter((time) => !sameRange(time, group));
}
