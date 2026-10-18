export interface TimeRange {
  /** Minutes after midnight. */
  start: number;
  end: number;
}

/** The empty calendar shows 8 AM–6 PM (div.app.md). */
export const DEFAULT_RANGE: Readonly<TimeRange> = { start: 480, end: 1080 };

const HALF_HOUR = 30;

/**
 * Fits the calendar to what it shows: from the half hour before the earliest item to the half hour
 * after the latest one (div.app-17.md). A start-time preference counts as an item, so its band is shown.
 */
export function fitRange(items: readonly TimeRange[], startsAfter = 0): TimeRange {
  if (items.length === 0) return { ...DEFAULT_RANGE };
  let earliest = Math.min(...items.map((item) => item.start));
  const latest = Math.max(...items.map((item) => item.end));
  if (startsAfter > 0) earliest = Math.min(earliest, startsAfter);
  return {
    start: Math.max(0, Math.floor((earliest - HALF_HOUR) / HALF_HOUR) * HALF_HOUR),
    end: Math.min(1440, Math.ceil((latest + HALF_HOUR) / HALF_HOUR) * HALF_HOUR),
  };
}

/** Where the time labels and lines go: both ends of the range and every full hour between them. */
export function hourMarks(range: TimeRange): number[] {
  const marks = [range.start];
  for (let minute = Math.floor(range.start / 60) * 60 + 60; minute < range.end; minute += 60) {
    marks.push(minute);
  }
  if (range.end > range.start) marks.push(range.end);
  return marks;
}

/** How far down the range a time is, in percent. */
export function percentOf(range: TimeRange, minutes: number): number {
  return ((minutes - range.start) / (range.end - range.start)) * 100;
}
