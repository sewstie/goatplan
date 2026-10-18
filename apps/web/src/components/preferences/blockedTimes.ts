import { formatDays, formatTimeRange, WEEK } from "@/lib/data";
import type { Day } from "@/lib/data/types";
import type { PlanBlockedTime } from "@/lib/store";

/** Blocked times with the same name, start and end, shown as one pill: "Work · Tue, Fri 2 PM–4 PM". */
export interface BlockedGroup {
  label: string | null;
  start: number;
  end: number;
  days: Day[];
}

const sameRange = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start === b.start && a.end === b.end;

const labelOf = (time: PlanBlockedTime) => time.label?.trim() || null;

const byWeekOrder = (a: Day, b: Day) => WEEK.indexOf(a) - WEEK.indexOf(b);

/** Groups in the order they were first added, days in week order. */
export function groupBlocked(blocked: readonly PlanBlockedTime[]): BlockedGroup[] {
  const groups: BlockedGroup[] = [];
  for (const time of blocked) {
    const label = labelOf(time);
    const group = groups.find((item) => item.label === label && sameRange(item, time));
    if (!group) groups.push({ label, start: time.start, end: time.end, days: [time.day] });
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

/**
 * Adds the range on each day with an optional name. A day that already blocks exactly that range
 * takes the new name instead of being added twice.
 */
export function addBlocked(
  blocked: readonly PlanBlockedTime[],
  days: readonly Day[],
  start: number,
  end: number,
  label = "",
): PlanBlockedTime[] {
  const name = label.trim();
  const make = (day: Day): PlanBlockedTime => (name ? { day, start, end, label: name } : { day, start, end });
  const wanted = [...new Set(days)].sort(byWeekOrder);
  const kept = blocked.map((time) => (wanted.includes(time.day) && sameRange(time, { start, end }) ? make(time.day) : time));
  const added = wanted.filter((day) => !blocked.some((time) => time.day === day && sameRange(time, { start, end })));
  return [...kept, ...added.map(make)];
}

export function removeGroup(blocked: readonly PlanBlockedTime[], group: BlockedGroup): PlanBlockedTime[] {
  return blocked.filter(
    (time) => !(sameRange(time, group) && labelOf(time) === group.label && group.days.includes(time.day)),
  );
}
