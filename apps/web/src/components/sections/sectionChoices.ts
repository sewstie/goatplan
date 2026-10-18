import { meetingSpans, meetsRules, optionOpenSeats, roomName, spansOverlap, type FitRules } from "@/lib/data";
import type { Course, Section } from "@/lib/data/types";
import { meetingLines, sectionsById, typeWord } from "./sectionDetails";

/** One way to take the course, as a row of the "Choose a lab" sheet. */
export interface SectionChoice {
  /** The whole option, as the store's pickOption wants it. */
  sectionIds: string[];
  /** Only the sections that differ between choices, like the lab. */
  sections: Section[];
  /** "CX03" */
  label: string;
  /** When those sections meet: "Thu · 4:00 PM–4:50 PM". */
  times: string;
  /** Another listed choice meets at the same times, so only the room tells them apart. */
  sharesTime: boolean;
  /** Short room names, "Higgins Labs 231", and the full ones for a title. */
  rooms: { short: string; full: string };
  openSeats: number;
}

export interface SectionChoices {
  /** "lab", or "section" when several kinds of section change. */
  kind: string;
  current: SectionChoice;
  /** The other choices that fit, by code. */
  others: SectionChoice[];
  /** The other choice with the most open seats. */
  suggested: SectionChoice;
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * The course's other options that fit around the rest of the shown schedule: no overlap with the
 * other courses' sections (`rest`), and they pass the preferences the engine filters by. null when
 * nothing else fits or the chosen sections aren't one of the course's options.
 */
export function sectionChoices(
  course: Course,
  chosen: readonly string[],
  rest: readonly Section[],
  rules: FitRules,
): SectionChoices | null {
  const currentIds = course.options.find((option) => sameSet(option, chosen));
  if (!currentIds) return null;
  const busy = meetingSpans(rest);
  const fitting = course.options.filter((option) => {
    if (option === currentIds) return false;
    const sections = sectionsById(course, option);
    return meetsRules(sections, rules) && !spansOverlap(meetingSpans(sections), busy);
  });
  if (fitting.length === 0) return null;

  // Sections every listed option shares (like the only lecture) aren't part of the choice.
  const listed = [currentIds, ...fitting];
  const varies = (id: string) => !listed.every((option) => option.includes(id));
  const timesOf = (option: readonly string[]) => sectionsById(course, option.filter(varies)).flatMap(meetingLines).join(", ");
  const allTimes = listed.map(timesOf);

  const toChoice = (sectionIds: string[]): SectionChoice => {
    const sections = sectionsById(course, sectionIds.filter(varies));
    const times = timesOf(sectionIds);
    const locations = [...new Set(sections.flatMap((section) => section.meetings.map((meeting) => meeting.location.trim())))]
      .filter(Boolean);
    return {
      sectionIds: [...sectionIds],
      sections,
      label: sections.map((section) => section.code).join(" · "),
      times,
      sharesTime: allTimes.filter((other) => other === times).length > 1,
      rooms: { short: locations.map(roomName).join(" · "), full: locations.join(" · ") },
      openSeats: optionOpenSeats(sections),
    };
  };

  const current = toChoice(currentIds);
  const others = fitting.map(toChoice).sort((a, b) => a.label.localeCompare(b.label, "en", { numeric: true }));
  const kinds = new Set([current, ...others].flatMap((choice) => choice.sections.map((section) => section.type)));
  const suggested = others.reduce((best, choice) => (choice.openSeats > best.openSeats ? choice : best));

  return { kind: kinds.size === 1 ? typeWord([...kinds][0]) : "section", current, others, suggested };
}

/** The meeting time, plus the room when the time alone doesn't tell the choice apart from another. */
export function choiceDetail(choice: SectionChoice): string {
  return choice.sharesTime && choice.rooms.short ? `${choice.times} · ${choice.rooms.short}` : choice.times;
}

export function choiceSeats(choice: SectionChoice): string {
  return choice.openSeats > 0 ? `${choice.openSeats} open` : "Full";
}
