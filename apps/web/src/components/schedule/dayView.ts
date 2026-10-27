import { WEEK } from "@/lib/data/days";
import type { Day } from "@/lib/data/types";
import type { ClassItem, UntimedItem } from "./scheduleItems";

// ── Types ──

export interface DayTab {
  day: Day;
  hasClasses: boolean;
}

export interface DayClassItem {
  kind: "class";
  item: ClassItem;
  start: number;
  end: number;
}

export interface DayBlockedItem {
  kind: "blocked";
  start: number;
  end: number;
  label?: string;
  day: Day;
}

export type DayItem = DayClassItem | DayBlockedItem;

export interface BlockedTime {
  day: Day;
  start: number;
  end: number;
  label?: string;
}

export interface DayViewResult {
  tabs: DayTab[];
  selectedDay: Day;
  dayClasses: (day: Day) => DayItem[];
  untimedItems: readonly UntimedItem[];
}

// ── Implementation ──

const WEEKDAYS: readonly Day[] = WEEK.slice(0, 5);

/**
 * Pure day-view module: turns the schedule's items and today's weekday into three things:
 * 1. The days to show, each with "has classes" (Mon–Fri, plus Sat/Sun only when used).
 * 2. The day to open on: today, or the next day with classes, weekends wrapping to Monday.
 * 3. Each day's classes sorted by start, with no-set-time items kept apart.
 */
export function dayView(
  classes: readonly ClassItem[],
  blockedOrUntimed: readonly (BlockedTime | UntimedItem)[],
  today: Day,
): DayViewResult {
  // Separate blocked times from untimed items
  const blocked: BlockedTime[] = [];
  const untimed: UntimedItem[] = [];
  for (const item of blockedOrUntimed) {
    if ("day" in item && "start" in item && "end" in item && !("sectionId" in item)) {
      blocked.push(item as BlockedTime);
    } else if ("sectionId" in item) {
      untimed.push(item as UntimedItem);
    }
  }

  // Group classes by day
  const classesByDay = new Map<Day, ClassItem[]>();
  for (const item of classes) {
    let list = classesByDay.get(item.day);
    if (!list) {
      list = [];
      classesByDay.set(item.day, list);
    }
    list.push(item);
  }

  // Group blocked times by day
  const blockedByDay = new Map<Day, BlockedTime[]>();
  for (const item of blocked) {
    let list = blockedByDay.get(item.day);
    if (!list) {
      list = [];
      blockedByDay.set(item.day, list);
    }
    list.push(item);
  }

  // Determine which days have any items
  const daysWithItems = new Set<Day>();
  for (const item of classes) daysWithItems.add(item.day);
  for (const item of blocked) daysWithItems.add(item.day);

  // Include weekends only when they have items
  const hasWeekend = daysWithItems.has("Sat") || daysWithItems.has("Sun");
  const visibleDays: readonly Day[] = hasWeekend ? WEEK : WEEKDAYS;

  // Build tabs
  const tabs: DayTab[] = visibleDays.map((day) => ({
    day,
    hasClasses: daysWithItems.has(day),
  }));

  // Determine default day
  const selectedDay = pickDefaultDay(daysWithItems, today, visibleDays);

  // Build day-item lookup: classes + blocked sorted by start
  const dayItemsCache = new Map<Day, DayItem[]>();

  function dayClasses(day: Day): DayItem[] {
    const cached = dayItemsCache.get(day);
    if (cached) return cached;

    const items: DayItem[] = [];
    for (const c of classesByDay.get(day) ?? []) {
      items.push({ kind: "class", item: c, start: c.start, end: c.end });
    }
    for (const b of blockedByDay.get(day) ?? []) {
      items.push({ kind: "blocked", start: b.start, end: b.end, label: b.label, day: b.day });
    }
    items.sort((a, b) => a.start - b.start || a.end - b.end);

    dayItemsCache.set(day, items);
    return items;
  }

  return { tabs, selectedDay, dayClasses, untimedItems: untimed };
}

/**
 * Pick the day to open on:
 * - If today is a weekday with classes → today.
 * - If today is a weekday without classes → search forward (wrapping Mon–Fri) for the next day with classes, or fall back to today.
 * - If today is a weekend → wrap to Monday, then advance to the next day with classes, or Monday.
 */
function pickDefaultDay(daysWithClasses: Set<Day>, today: Day, visible: readonly Day[]): Day {
  const todayIndex = WEEK.indexOf(today);

  // Weekends always wrap to Monday first, then advance to next day with classes
  if (todayIndex >= 5) {
    return nextDayWithClasses(daysWithClasses, 0, visible) ?? "Mon";
  }

  // Today is a weekday with classes → stay
  if (daysWithClasses.has(today)) return today;

  // Search forward from tomorrow, wrapping through visible days
  return nextDayWithClasses(daysWithClasses, todayIndex + 1, visible) ?? today;
}

/** Find the next day with classes starting from `fromIndex` in WEEK, wrapping through visible days. */
function nextDayWithClasses(daysWithClasses: Set<Day>, fromIndex: number, visible: readonly Day[]): Day | null {
  const len = visible.length;
  // Search forward from fromIndex, wrapping around the visible days
  for (let offset = 0; offset < len; offset++) {
    const i = (fromIndex + offset) % len;
    if (daysWithClasses.has(visible[i])) return visible[i];
  }
  return null;
}
