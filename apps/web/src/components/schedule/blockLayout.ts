import { DAY_NAMES } from "@/lib/data/days";
import { formatTimeRange, formatTimeShort } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import { compactRange } from "./dragBlock";

/** How much text a calendar block has room for: all of it, one line, or none. */
export type BlockLayout = "full" | "line" | "none";

const FULL_PX = 48;
const LINE_PX = 18;

export function blockLayout(heightPx: number | null): BlockLayout {
  if (heightPx === null || heightPx >= FULL_PX) return "full";
  if (heightPx >= LINE_PX) return "line";
  return "none";
}

/** A block's height in px from its minutes and the hour height, less the gap at its end. */
export function blockHeight(minutes: number, pixelsPerHour: number | null, endGap = 0): number | null {
  return pixelsPerHour === null ? null : (minutes / 60) * pixelsPerHour - endGap;
}

/**
 * A CSS mask that hides a block's text where classes lie on top of it, so the two labels never print
 * over each other. undefined when nothing covers it.
 */
export function coveredTextMask(start: number, end: number, covers: readonly { start: number; end: number }[]): string | undefined {
  const spans = covers
    .map((cover) => ({ from: Math.max(cover.start, start), to: Math.min(cover.end, end) }))
    .filter((span) => span.from < span.to)
    .sort((a, b) => a.from - b.from)
    .reduce<{ from: number; to: number }[]>((merged, span) => {
      const last = merged.at(-1);
      if (last && span.from <= last.to) last.to = Math.max(last.to, span.to);
      else merged.push({ ...span });
      return merged;
    }, []);
  if (spans.length === 0) return undefined;
  const at = (minute: number) => `${Math.round(((minute - start) / (end - start)) * 10000) / 100}%`;
  const stops = spans.flatMap(({ from, to }) => [`black ${at(from)}`, `transparent ${at(from)}`, `transparent ${at(to)}`, `black ${at(to)}`]);
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

/** 720–750 → "12–12:30", for one short line where the full text sits in the label. */
export function clockRange(start: number, end: number): string {
  const clock = (minute: number) => formatTimeShort(minute).replace(/ [AP]M$/, "");
  return `${clock(start)}–${clock(end)}`;
}

/** "Work · 12–12:30", or "12–12:30 PM" without a name. */
export function blockedLine(start: number, end: number, label?: string): string {
  return label ? `${label} · ${clockRange(start, end)}` : compactRange({ start, end });
}

/** "Monday 12:00 to 12:30 PM" */
export function spokenTime(day: Day, start: number, end: number): string {
  return `${DAY_NAMES[day]} ${formatTimeRange(start, end, "shared").replace("–", " to ")}`;
}

/** "Work, Monday 12:00 to 12:30 PM, blocked" */
export function blockedLabel(day: Day, start: number, end: number, label?: string): string {
  return [label, spokenTime(day, start, end), "blocked"].filter(Boolean).join(", ");
}
