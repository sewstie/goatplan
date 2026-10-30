import type { Day } from "@/lib/data/types";
import type { PlanBlockedTime } from "@/lib/store";
import { addBlocked } from "@/components/preferences/blockedTimes";
import { formatDays } from "@/lib/data/days";
import { formatTimeRange, formatTimeShort } from "@/lib/data/time";
import type { TimeRange } from "./timeRange";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function minuteAt(y: number, top: number, height: number, range: TimeRange): number {
  const share = height > 0 ? (y - top) / height : 0;
  return clamp(range.start + share * (range.end - range.start), range.start, range.end);
}

const STEP = 30;

export function snapRange(anchor: number, current: number, range: TimeRange): TimeRange {
  const start = Math.floor(Math.min(anchor, current) / STEP) * STEP;
  const end = Math.min(range.end, Math.max(Math.ceil(Math.max(anchor, current) / STEP) * STEP, start + STEP));
  return { start: Math.max(range.start, Math.min(start, end - STEP)), end };
}

export function dayIndexAt(x: number, columns: readonly { left: number; right: number }[]): number {
  const index = columns.findIndex((column) => x < column.right);
  return index < 0 ? columns.length - 1 : index;
}

export type DayRange = TimeRange & { day: Day };

export function dayRanges(days: readonly Day[], from: number, to: number, time: TimeRange): DayRange[] {
  return days.slice(Math.min(from, to), Math.max(from, to) + 1).map((day) => ({ day, ...time }));
}

const nameOf = (time: PlanBlockedTime) => time.label?.trim() ?? "";

const joins = (a: PlanBlockedTime, b: PlanBlockedTime) =>
  a.day === b.day && nameOf(a) === nameOf(b) && a.start <= b.end && b.start <= a.end;

export function mergeBlocked(blocked: readonly PlanBlockedTime[]): PlanBlockedTime[] {
  let merged: PlanBlockedTime[] = [];
  for (const time of blocked) {
    const joined = merged.filter((other) => joins(other, time));
    if (joined.length === 0) {
      merged.push(time);
      continue;
    }
    const start = Math.min(time.start, ...joined.map((other) => other.start));
    const end = Math.max(time.end, ...joined.map((other) => other.end));
    const first = joined[0];
    merged = merged.flatMap((other) => (other === first ? [{ ...first, start, end }] : joined.includes(other) ? [] : [other]));
  }
  return merged;
}

export function subtractBlocked(blocked: readonly PlanBlockedTime[], ranges: readonly DayRange[]): PlanBlockedTime[] {
  return blocked.flatMap((time) => {
    const cut = ranges.find((range) => range.day === time.day && range.start < time.end && time.start < range.end);
    if (!cut) return [time];
    const pieces = [
      { ...time, end: Math.min(time.end, cut.start) },
      { ...time, start: Math.max(time.start, cut.end) },
    ];
    return pieces.filter((piece) => piece.start < piece.end);
  });
}

export function addRanges(blocked: readonly PlanBlockedTime[], ranges: readonly DayRange[]): PlanBlockedTime[] {
  if (ranges.length === 0) return [...blocked];
  const { start, end } = ranges[0];
  const covered = (day: Day) => blocked.some((time) => time.day === day && time.start <= start && end <= time.end);
  const days = ranges.map((range) => range.day).filter((day) => !covered(day));
  return mergeBlocked(addBlocked(blocked, days, start, end));
}

export function blockedAt(blocked: readonly PlanBlockedTime[], day: Day, minute: number): boolean {
  return blocked.some((time) => time.day === day && time.start <= minute && minute < time.end);
}

export function selectionText(days: readonly Day[], time: TimeRange, erase: boolean): string {
  return `${erase ? "Remove " : ""}${formatDays(days)} ${formatTimeRange(time.start, time.end, "shared")}`;
}

function compactRange({ start, end }: TimeRange): string {
  const from = formatTimeShort(start);
  const to = formatTimeShort(end);
  return from.slice(-2) === to.slice(-2) ? `${from.slice(0, -3)}–${to}` : `${from}–${to}`;
}

export function changeText(days: readonly Day[], time: TimeRange, erase: boolean): string {
  return `${erase ? "Unblocked" : "Blocked"} ${formatDays(days)} ${compactRange(time)}`;
}

export function changedDays(before: readonly PlanBlockedTime[], after: readonly PlanBlockedTime[], ranges: readonly DayRange[]): Day[] {
  const onDay = (blocked: readonly PlanBlockedTime[], day: Day) => JSON.stringify(blocked.filter((time) => time.day === day));
  return ranges.map((range) => range.day).filter((day) => onDay(before, day) !== onDay(after, day));
}
