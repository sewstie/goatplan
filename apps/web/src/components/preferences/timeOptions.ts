import { formatTime } from "@/lib/data";
import type { SelectOption } from "@/components/ui/Select";

/** startsAfter 0 turns the rule off. */
export const ANY_TIME = 0;

const STARTS_AFTER_FROM = 7 * 60;
const STARTS_AFTER_TO = 13 * 60;
const STEP = 30;

/** Every STEP minutes from `from` to `to`, both included. */
export function timesBetween(from: number, to: number, step = STEP): number[] {
  const times: number[] = [];
  for (let time = from; time <= to; time += step) times.push(time);
  return times;
}

const toOption = (minutes: number): SelectOption => ({ value: String(minutes), label: formatTime(minutes) });

/**
 * "Any time", then 7:00 AM to 1:00 PM by half hours. A value set elsewhere (a fix can pick any
 * minute) is added in order so the select always shows the real preference.
 */
export function startsAfterOptions(current: number): SelectOption[] {
  const times = timesBetween(STARTS_AFTER_FROM, STARTS_AFTER_TO);
  if (current !== ANY_TIME && !times.includes(current)) {
    times.push(current);
    times.sort((a, b) => a - b);
  }
  return [{ value: String(ANY_TIME), label: "Any time" }, ...times.map(toOption)];
}

/** Choices for the start and end of a blocked time. */
export const BLOCK_FROM = 7 * 60;
export const BLOCK_TO = 22 * 60;

export function blockStartOptions(): SelectOption[] {
  return timesBetween(BLOCK_FROM, BLOCK_TO - STEP).map(toOption);
}

export function blockEndOptions(start: number): SelectOption[] {
  return timesBetween(start + STEP, BLOCK_TO).map(toOption);
}

/** Keeps the end after the start: an end that no longer fits moves to an hour after the start. */
export function endAfter(start: number, end: number): number {
  return end > start ? end : Math.min(start + 60, BLOCK_TO);
}
