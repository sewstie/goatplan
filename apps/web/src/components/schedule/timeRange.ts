export interface TimeRange {
  start: number;
  end: number;
}

export const DEFAULT_RANGE: Readonly<TimeRange> = { start: 480, end: 1020 };

export function fitRange(items: readonly TimeRange[]): TimeRange {
  let { start, end } = DEFAULT_RANGE;
  for (const item of items) {
    start = Math.min(start, Math.floor(item.start / 60) * 60);
    end = Math.max(end, Math.ceil(item.end / 60) * 60);
  }
  return { start: Math.max(0, start), end: Math.min(1440, end) };
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
