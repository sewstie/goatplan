import { optionOpenSeats } from "@/lib/data";
import type { Course, Section } from "@/lib/data/types";
import { meetingLines, placeLine, sectionsById, typeWord } from "./sectionDetails";

/** One way to take the course at the same times as the current one. */
export interface SameTimeChoice {
  /** The whole option, as the store's chooseAlternative wants it. */
  sectionIds: string[];
  /** Only the sections that change between choices, like the lab. */
  sections: Section[];
  /** "CX04" */
  label: string;
  /** Room and instructor, what tells same-time sections apart: "Higgins Labs 231 · Ye Lu". */
  detail: string;
  openSeats: number;
}

export interface SameTimeChoices {
  /** "lab", or "section" when several kinds of section change. */
  kind: string;
  /** When they all meet: "Thu · 3:00 PM–3:50 PM". */
  times: string[];
  current: SameTimeChoice;
  /** The other choices, by code. */
  others: SameTimeChoice[];
  /** The other choice with the most open seats. */
  suggested: SameTimeChoice;
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

function sectionDetail(section: Section): string {
  const names = section.instructors.map((name) => name.trim()).filter(Boolean);
  return [placeLine(section), names.join(", ")].filter(Boolean).join(" · ");
}

/**
 * The same-time alternatives the engine found for a course in the current schedule. null when there
 * is nothing else to pick or the chosen sections aren't one of them.
 */
export function sameTimeChoices(
  course: Course,
  alternatives: readonly string[][],
  chosen: readonly string[],
): SameTimeChoices | null {
  if (alternatives.length < 2) return null;
  const currentIds = alternatives.find((option) => sameSet(option, chosen));
  if (!currentIds) return null;

  const changing = new Set(alternatives.flat().filter((id) => !alternatives.every((option) => option.includes(id))));
  const toChoice = (sectionIds: string[]): SameTimeChoice => {
    const sections = sectionsById(course, sectionIds.filter((id) => changing.has(id)));
    return {
      sectionIds: [...sectionIds],
      sections,
      label: sections.map((section) => section.code).join(" · "),
      detail: sections.map(sectionDetail).filter(Boolean).join(" / "),
      openSeats: optionOpenSeats(sections),
    };
  };

  const current = toChoice(currentIds);
  const others = alternatives
    .filter((option) => option !== currentIds)
    .map(toChoice)
    .filter((choice) => choice.sections.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "en", { numeric: true }));
  if (others.length === 0) return null;

  const kinds = new Set([current, ...others].flatMap((choice) => choice.sections.map((section) => section.type)));
  const suggested = others.reduce((best, choice) => (choice.openSeats > best.openSeats ? choice : best));

  return {
    kind: kinds.size === 1 ? typeWord([...kinds][0]) : "section",
    times: current.sections.flatMap(meetingLines),
    current,
    others,
    suggested,
  };
}
