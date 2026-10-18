import { WEEK, type Day, type Meeting, type Section } from "@/lib/data";
import type { BlockedTime } from "@/lib/engine/types";
import { SORT_PRESET_IDS, type SortPresetId } from "@/lib/store";
import type { SavedCourse, SavedPlan } from "./types";

// Saved plans have their own keys, apart from the planner store's drafts ("goatplan:draft:").
export const PLANS_STORAGE_PREFIX = "goatplan:plans:";
export const PLANS_VERSION = 1;

const PLAN_PREFIX = `${PLANS_STORAGE_PREFIX}v${PLANS_VERSION}:plan:`;
const CURRENT_PREFIX = `${PLANS_STORAGE_PREFIX}v${PLANS_VERSION}:current:`;

export type PlanStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export function planKey(id: string): string {
  return `${PLAN_PREFIX}${id}`;
}

/** The plan each term's working draft was saved as or opened from. */
export function currentPlanKey(termId: string): string {
  return `${CURRENT_PREFIX}${termId}`;
}

/** localStorage, or null where it doesn't exist or is blocked. */
export function browserPlanStorage(): PlanStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const isMinute = (value: unknown): value is number => isCount(value) && (value as number) <= 1440;
const isDayList = (value: unknown): value is Day[] =>
  Array.isArray(value) && value.every((day) => WEEK.includes(day as Day));

function isMeeting(value: unknown): value is Meeting {
  return (
    isObject(value) &&
    isDayList(value.days) &&
    isMinute(value.start) &&
    isMinute(value.end) &&
    isString(value.location)
  );
}

function isSection(value: unknown): value is Section {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.code) &&
    isString(value.type) &&
    isString(value.status) &&
    isCount(value.enrolled) &&
    isCount(value.capacity) &&
    isObject(value.waitlist) &&
    isCount(value.waitlist.taken) &&
    isCount(value.waitlist.capacity) &&
    isStringArray(value.instructors) &&
    isString(value.delivery) &&
    Array.isArray(value.meetings) &&
    value.meetings.every(isMeeting)
  );
}

function isSavedCourse(value: unknown): value is SavedCourse {
  return (
    isObject(value) &&
    isString(value.code) &&
    isString(value.title) &&
    Array.isArray(value.sections) &&
    value.sections.length > 0 &&
    value.sections.every(isSection)
  );
}

function isBlockedTime(value: unknown): value is BlockedTime {
  return (
    isObject(value) &&
    WEEK.includes(value.day as Day) &&
    isMinute(value.start) &&
    isMinute(value.end) &&
    (value.start as number) < (value.end as number)
  );
}

const isLocks = (value: unknown): value is Record<string, string[]> =>
  isObject(value) && Object.values(value).every(isStringArray);

/** A stored plan, or null if the data is broken or from another version. Never throws. */
export function parsePlan(value: unknown): SavedPlan | null {
  if (!isObject(value) || value.version !== PLANS_VERSION) return null;
  const { id, name, termId, term, savedAt, courses, schedule, locks, preferences, sortPreset } = value;
  if (!isString(id) || !isString(name) || !isString(termId) || !isString(savedAt)) return null;
  if (!isObject(term) || !isString(term.name) || !isString(term.season) || !Number.isInteger(term.year)) return null;
  if (!isStringArray(courses) || !Array.isArray(schedule) || !schedule.every(isSavedCourse)) return null;
  if (!isLocks(locks) || !SORT_PRESET_IDS.includes(sortPreset as SortPresetId)) return null;
  if (!isObject(preferences) || !isMinute(preferences.startsAfter) || typeof preferences.onlyOpen !== "boolean") return null;
  if (!Array.isArray(preferences.blocked) || !preferences.blocked.every(isBlockedTime)) return null;

  return {
    id,
    name,
    termId,
    term: { name: term.name, season: term.season, year: term.year as number },
    savedAt,
    courses: [...courses],
    schedule,
    locks: { ...locks },
    preferences: {
      startsAfter: preferences.startsAfter,
      blocked: preferences.blocked.map(({ day, start, end }) => ({ day, start, end })),
      onlyOpen: preferences.onlyOpen,
    },
    sortPreset: sortPreset as SortPresetId,
  };
}

function keysWithPrefix(storage: PlanStorage, prefix: string): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

/** Every readable plan, the most recently saved first. Broken entries are skipped. */
export function readPlans(storage: PlanStorage | null): SavedPlan[] {
  if (!storage) return [];
  try {
    const plans: SavedPlan[] = [];
    for (const key of keysWithPrefix(storage, PLAN_PREFIX)) {
      try {
        const plan = parsePlan(JSON.parse(storage.getItem(key) ?? "null"));
        if (plan && planKey(plan.id) === key) plans.push(plan);
      } catch {
        // One broken plan doesn't hide the others.
      }
    }
    return plans.sort((a, b) => b.savedAt.localeCompare(a.savedAt) || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/** Returns false when the plan couldn't be stored (no storage, or it's full or blocked). */
export function writePlan(storage: PlanStorage | null, plan: SavedPlan): boolean {
  if (!storage) return false;
  try {
    storage.setItem(planKey(plan.id), JSON.stringify({ version: PLANS_VERSION, ...plan }));
    return true;
  } catch {
    return false;
  }
}

/** Removes the plan and forgets it as any term's current plan. */
export function removePlan(storage: PlanStorage | null, id: string): void {
  if (!storage) return;
  try {
    storage.removeItem(planKey(id));
    for (const key of keysWithPrefix(storage, CURRENT_PREFIX)) {
      if (storage.getItem(key) === id) storage.removeItem(key);
    }
  } catch {
    // Blocked storage: nothing was there to remove.
  }
}

/** term id → the id of that term's current plan. */
export function readCurrentPlanIds(storage: PlanStorage | null): Record<string, string> {
  if (!storage) return {};
  try {
    const current: Record<string, string> = {};
    for (const key of keysWithPrefix(storage, CURRENT_PREFIX)) {
      const id = storage.getItem(key);
      if (id) current[key.slice(CURRENT_PREFIX.length)] = id;
    }
    return current;
  } catch {
    return {};
  }
}

export function writeCurrentPlanId(storage: PlanStorage | null, termId: string, id: string | null): void {
  if (!storage) return;
  try {
    if (id) storage.setItem(currentPlanKey(termId), id);
    else storage.removeItem(currentPlanKey(termId));
  } catch {
    // Same as writePlan, but there's nothing to report: the link is a convenience.
  }
}
