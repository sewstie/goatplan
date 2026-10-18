import type { Delivery } from "@/lib/data/types";
import type { Score, SolveResponse } from "@/lib/engine/types";
import type { SolveStatus, TermStatus } from "@/lib/store/types";

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

/**
 * The chips after the summary line: what the shown schedule is like, in the terms the Sort order uses.
 * "Early" is the Sort cutoff (10 AM), not the start-time preference, so the chips don't name a time.
 */
export function scoreChips(score: Score): string[] {
  return [
    `${count("day", score.days)} on campus`,
    score.gapMinutes === 0 ? "No gaps between classes" : `${formatDuration(score.gapMinutes)} between classes`,
    score.earlyMinutes === 0 ? "No early classes" : `${formatDuration(score.earlyMinutes)} of early classes`,
  ];
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
}

/** The line under the title (div.app-1.md, div.app-4.md, div.app-13.md, div.app-15.md). */
export function summaryText(input: SummaryInput): string | null {
  const { termStatus, termName, courseCount, response } = input;
  if (termStatus === "loading") return termName ? `Loading ${termName} sections…` : null;
  if (termStatus !== "ready") return null;
  if (courseCount === 0) return "Add courses to start planning your term.";

  const parts = [count("course", courseCount)];
  if (response?.ok && response.patterns > 0) {
    parts.push(fitCount(response));
    if (input.untimedCourses > 0) {
      parts.push(`${count("course", input.untimedCourses)} ${input.untimedCourses === 1 ? "has" : "have"} no set time`);
    }
    if (input.hasWaitlist) parts.push("includes a waitlist section");
  } else if (response?.ok) {
    const pair = response.diagnosis?.clashingPairs[0];
    parts.push(pair ? `${pair[0]} and ${pair[1]} overlap` : "no schedule fits");
  }
  return parts.join(" · ");
}

export type BannerTone = "info" | "warning" | "loading";

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
  if (input.slow && (input.solveStatus === "waiting" || input.solveStatus === "solving")) {
    return { tone: "loading", title: "Finding schedules…", detail: "This can take a few seconds with many courses." };
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

  if (input.waitlisted.length > 0) {
    const names = input.waitlisted.map((section) => `${section.courseCode} ${section.sectionCode}`);
    return {
      tone: "info",
      title: `${listNames(names)} ${names.length === 1 ? "is" : "are"} waitlist only.`,
      detail: `${names.length === 1 ? "It fits" : "They fit"} your times, but registration is not guaranteed.`,
    };
  }

  if (response.capped) {
    return {
      tone: "info",
      title: "There are too many combinations to check them all.",
      detail: `Showing the best ${count("schedule", input.shownSchedules)} found. ${NARROW_DOWN}`,
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
