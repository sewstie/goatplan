const MINUTES_PER_DAY = 1440;

function clock(minutes: number) {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > MINUTES_PER_DAY) {
    throw new RangeError(`Not a time of day in minutes: ${minutes}`);
  }
  const hours = Math.floor(minutes / 60) % 24;
  return {
    hour: hours % 12 || 12,
    minute: minutes % 60,
    period: hours < 12 ? "AM" : "PM",
  };
}

function hourAndMinute(minutes: number, dropZeroMinutes: boolean): string {
  const { hour, minute } = clock(minutes);
  if (dropZeroMinutes && minute === 0) return `${hour}`;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

/** 540 → "9:00 AM" */
export function formatTime(minutes: number): string {
  return `${hourAndMinute(minutes, false)} ${clock(minutes).period}`;
}

/** 540 → "9 AM", 510 → "8:30 AM". Used for hour labels and blocked times. */
export function formatTimeShort(minutes: number): string {
  return `${hourAndMinute(minutes, true)} ${clock(minutes).period}`;
}

type RangeStyle = "full" | "shared" | "short";

/**
 * 540–590 → "9:00 AM–9:50 AM" (full), "9:00–9:50 AM" (shared: AM/PM once when both ends share it),
 * 840–960 → "2 PM–4 PM" (short).
 */
export function formatTimeRange(start: number, end: number, style: RangeStyle = "full"): string {
  if (style === "short") return `${formatTimeShort(start)}–${formatTimeShort(end)}`;
  if (style === "shared" && clock(start).period === clock(end).period) {
    return `${hourAndMinute(start, false)}–${formatTime(end)}`;
  }
  return `${formatTime(start)}–${formatTime(end)}`;
}
