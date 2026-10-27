import type { Day, Delivery } from "@/lib/data/types";
import { formatTimeShort } from "@/lib/data/time";
import type { Score, SolveResponse } from "@/lib/engine/types";
import type { SolveStatus, SortPresetId, TermStatus } from "@/lib/store/types";

const numberFormat = new Intl.NumberFormat("en-US");

/** count("course", 1) → "1 course", count("course", 3) → "3 courses". */
export function count(noun: string, amount: number): string {
  return `${numberFormat.format(amount)} ${noun}${amount === 1 ? "" : "s"}`;
}

/** "A", "A and B", "A, B and C". */
export function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** 50 → "50 min", 60 → "1 h", 150 → "2 h 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

// ── Schedule badges ──

/** A single meeting on the calendar: one class block on one day. */
export interface BadgeMeeting {
  day: Day;
  /** Minutes after midnight. */
  start: number;
  /** Minutes after midnight. */
  end: number;
}

/** The weekdays in calendar order (Mon–Fri). */
const WEEKDAYS: readonly Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Short day names for badge text: "Mon", "Tue", etc. are already short enough. */
const SHORT_DAY: Readonly<Record<Day, string>> = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

/** Badge category keys, in the default display order (after any lead badge). */
type BadgeKind = "DaysOff" | "Start" | "FreeTime" | "Finish";

const DEFAULT_ORDER: readonly BadgeKind[] = ["DaysOff", "Start", "FreeTime", "Finish"];

/** Which badge kind leads for each sort preset. bestOverall has no lead. */
const LEAD_BADGE: Partial<Record<SortPresetId, BadgeKind>> = {
  latestStart: "Start",
  fewestEarly: "Start",
  earliestFinish: "Finish",
  fewestDays: "DaysOff",
  fewestGaps: "FreeTime",
};

/** Breaks this long or shorter are the walk between back-to-back classes, not free time (the engine's rule). */
const WALK_MINUTES = 10;
const MAX_BADGES = 3;

/**
 * Up to three badge texts describing the shown schedule. Replaces the old scoreChips.
 *
 * Input: the schedule's meetings (day, start, end), its engine score and the current sort preset.
 * Meetings with no set time (online/async courses) are excluded by the caller
 * — they simply don't appear in the meetings array.
 *
 * Free time comes from `score.freeMinutes`, the measure "Most compact" ranks by. A plan saved
 * before the engine sent it has no `freeMinutes`; then it's worked out from the meetings with
 * the same rule.
 */
export function scheduleBadges(
  meetings: readonly BadgeMeeting[],
  score: Readonly<Pick<Score, "freeMinutes">>,
  preset: SortPresetId,
): string[] {
  if (meetings.length === 0) return [];

  // ── Week facts ──
  let earliestStart = Infinity;
  let latestEnd = -Infinity;
  const meetingsByDay = new Map<Day, { start: number; end: number }[]>();

  for (const meeting of meetings) {
    if (meeting.start < earliestStart) earliestStart = meeting.start;
    if (meeting.end > latestEnd) latestEnd = meeting.end;
    let dayMeetings = meetingsByDay.get(meeting.day);
    if (!dayMeetings) {
      dayMeetings = [];
      meetingsByDay.set(meeting.day, dayMeetings);
    }
    dayMeetings.push({ start: meeting.start, end: meeting.end });
  }

  // Free weekdays (Mon–Fri only).
  const freeDays = WEEKDAYS.filter((day) => !meetingsByDay.has(day));

  // Free time: same-day breaks longer than the walk between classes, summed over the week.
  // Taken from the score; worked out from the meetings only when the score lacks it.
  // Overlapping meetings count as one stretch of class.
  let fromMeetings = 0;
  if (score.freeMinutes === undefined) {
    for (const [, dayMeetings] of meetingsByDay) {
      const sorted = [...dayMeetings].sort((a, b) => a.start - b.start);
      let busyUntil = sorted[0].end;
      for (const meeting of sorted.slice(1)) {
        const free = meeting.start - busyUntil;
        if (free > WALK_MINUTES) fromMeetings += free;
        busyUntil = Math.max(busyUntil, meeting.end);
      }
    }
  }
  const freeMinutes = score.freeMinutes ?? fromMeetings;

  // ── Badge text per kind ──
  function badgeText(kind: BadgeKind): string | null {
    switch (kind) {
      case "Start":
        return `Starts ${formatTimeShort(earliestStart)}`;
      case "Finish":
        return `Done by ${formatTimeShort(latestEnd)}`;
      case "DaysOff": {
        if (freeDays.length === 0) return null;
        if (freeDays.length === 1) return `${SHORT_DAY[freeDays[0]]} off`;
        if (freeDays.length === 2) return `${SHORT_DAY[freeDays[0]]}, ${SHORT_DAY[freeDays[1]]} off`;
        return `${freeDays.length} days off`;
      }
      case "FreeTime": {
        if (freeMinutes <= 0) return "No gaps between classes";
        if (freeMinutes < 60) return `${freeMinutes} min free between classes`;
        // An hour or more: to the nearest half hour, so 75 → "1.5 h" and 150 → "2.5 h".
        return `${Math.round(freeMinutes / 30) / 2} h free between classes`;
      }
    }
  }

  // ── Ordering: lead badge first, then default order, cap at 3 ──
  const lead = LEAD_BADGE[preset];
  const order: BadgeKind[] = lead
    ? [lead, ...DEFAULT_ORDER.filter((kind) => kind !== lead)]
    : [...DEFAULT_ORDER];

  const badges: string[] = [];
  for (const kind of order) {
    if (badges.length >= MAX_BADGES) break;
    const text = badgeText(kind);
    if (text !== null) badges.push(text);
  }

  return badges;
}

/** "1,234 schedules fit", or "1,234+ schedules fit" when the engine stopped counting. */
function fitCount(response: Extract<SolveResponse, { ok: true }>): string {
  const amount = `${numberFormat.format(response.patterns)}${response.capped ? "+" : ""}`;
  return response.patterns === 1 && !response.capped ? "1 schedule fits" : `${amount} schedules fit`;
}

export interface SummaryInput {
  termStatus: TermStatus;
  termName: string | null;
  courseCount: number;
  response: SolveResponse | null;
  untimedCourses: number;
  hasWaitlist: boolean;
  solveStatus?: SolveStatus;
}

/** The line under the title (div.app-1.md, div.app-4.md, div.app-13.md, div.app-15.md). */
export function summaryText(input: SummaryInput): string | null {
  const { termStatus, termName, courseCount, response } = input;
  if (termStatus === "loading") return termName ? `Loading ${termName} sections…` : null;
  if (termStatus !== "ready") return null;
  if (courseCount === 0) return "Add courses to start planning your term.";
  if (input.solveStatus && input.solveStatus !== "done") return count("course", courseCount);

  const parts = [count("course", courseCount)];
  if (response?.ok && response.patterns > 0) {
    parts.push(fitCount(response));
    if (input.untimedCourses > 0) {
      parts.push(`${count("course", input.untimedCourses)} ${input.untimedCourses === 1 ? "has" : "have"} no set time`);
    }
    if (input.hasWaitlist) parts.push("includes a waitlist section");
  } else if (response?.ok) {
    if (response.diagnosis?.unsure) return `${count("course", courseCount)} · Search incomplete`;
    const pair = response.diagnosis?.clashingPairs[0];
    parts.push(pair ? `${pair[0]} and ${pair[1]} overlap` : "no schedule fits");
  }
  return parts.join(" · ");
}

export type BannerTone = "info" | "warning" | "loading" | "success";

export interface BannerMessage {
  tone: BannerTone;
  /** Shown in bold. */
  title: string;
  detail: string;
}

export interface BannerInput {
  courseCount: number;
  solveStatus: SolveStatus;
  /** The engine has been working for a while. */
  slow: boolean;
  solveError: string | null;
  response: SolveResponse | null;
  shownSchedules: number;
  waitlisted: readonly { courseCode: string; sectionCode: string }[];
}

const NARROW_DOWN = "Lock a section or add preferences to narrow it down.";

/** The one message the banner shows, most important first, or null. */
export function bannerMessage(input: BannerInput): BannerMessage | null {
  const { response } = input;
  if (input.courseCount === 0) return null;

  if (input.solveStatus === "error") {
    return {
      tone: "warning",
      title: "Couldn’t check your schedules.",
      detail: "Something went wrong. Change a preference to try again.",
    };
  }
  if (input.solveStatus === "waiting" || input.solveStatus === "solving") {
    return input.slow ? { tone: "loading", title: "Finding schedules…", detail: "This can take a few seconds with many courses." } : null;
  }
  if (!response) return null;
  if (!response.ok) {
    const detail =
      response.error.code === "unknownCourse" && response.error.detail
        ? `${response.error.detail} isn’t offered this term any more. Remove it to see your schedules.`
        : "Something went wrong. Change a preference to try again.";
    return { tone: "warning", title: "Couldn’t check your schedules.", detail };
  }

  if (response.total === 0) {
    const diagnosis = response.diagnosis;
    if (diagnosis?.unsure) {
      return { tone: "warning", title: "Too many combinations to check.", detail: "Try fewer courses." };
    }
    const pair = diagnosis?.clashingPairs[0];
    const empty = diagnosis?.emptyCourses[0];
    const group = diagnosis?.minimalClash ?? [];
    let detail = "Try removing a course or changing your preferences.";
    if (empty) detail = `${empty.code} has no sections that fit your preferences.`;
    else if (pair) detail = `${pair[0]} and ${pair[1]} overlap.`;
    else if (group.length > 0) detail = `${listNames(group)} can’t all fit together.`;
    return { tone: "warning", title: "No schedule fits.", detail };
  }

  if (response.capped) {
    const waitlist = input.waitlisted.length > 0
      ? ` ${listNames(input.waitlisted.map((section) => `${section.courseCode} ${section.sectionCode}`))} ${input.waitlisted.length === 1 ? "is" : "are"} waitlist only. Registration is not guaranteed.`
      : "";
    return {
      tone: "info",
      title: "There are too many combinations to check them all.",
      detail: `Showing the best ${count("schedule", input.shownSchedules)} found. ${NARROW_DOWN}${waitlist}`,
    };
  }
  if (input.waitlisted.length > 0) {
    const names = input.waitlisted.map((section) => `${section.courseCode} ${section.sectionCode}`);
    return {
      tone: "info",
      title: `${listNames(names)} ${names.length === 1 ? "is" : "are"} waitlist only.`,
      detail: `${names.length === 1 ? "It fits" : "They fit"} your times, but registration is not guaranteed.`,
    };
  }

  if (response.patterns > input.shownSchedules) {
    return {
      tone: "info",
      title: `Showing the best ${numberFormat.format(input.shownSchedules)} of ${count("schedule", response.patterns)}.`,
      detail: NARROW_DOWN,
    };
  }
  return null;
}

const DELIVERY_NAMES: Readonly<Record<Delivery, string>> = {
  "in-person": "In person",
  hybrid: "Hybrid",
  online: "Online",
  "online-sync": "Online, live",
  "online-async": "Online, asynchronous",
};

export function deliveryName(delivery: Delivery): string {
  return DELIVERY_NAMES[delivery];
}
