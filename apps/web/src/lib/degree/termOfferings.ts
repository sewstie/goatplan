import type { Course, Section, TermFile } from "@/lib/data/types";
import { crossListed } from "./rules";
import { compareTerms, parseTerm, termLong, type TermName } from "./terms";

export type TermOffer = "offered" | "not-offered";
export type TermOffers = ReadonlyMap<string, TermOffer>;
export type OfferedCodes = ReadonlyMap<string, ReadonlySet<string>>;

export const termIdOf = ({ year, letter }: TermName) => `${year}-${letter}`;

export function offeredCodes(files: readonly TermFile[]): Map<string, Set<string>> {
  return new Map(files.map((file) => [file.term.id, new Set(file.courses.filter((course) => course.sections.length > 0).map((course) => course.code))]));
}

export function withTermSections<T extends Course>(courses: readonly T[], files: readonly TermFile[]): T[] {
  const sections = new Map<string, Section[]>();
  for (const file of files) for (const course of file.courses) sections.set(course.code, [...(sections.get(course.code) ?? []), ...course.sections]);
  return courses.map((course) => (sections.has(course.code) ? { ...course, sections: sections.get(course.code)! } : course));
}

export function termOffers(code: string, offered: OfferedCodes): Map<string, TermOffer> {
  const names = crossListed(code);
  return new Map([...offered].map(([termId, codes]) => [termId, names.some((name) => codes.has(name)) ? "offered" : "not-offered"]));
}

function joined(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export function offerHint(code: string, term: string, offers: TermOffers | undefined): { text: string; offered: boolean } | null {
  const chosen = parseTerm(term);
  const offer = chosen ? offers?.get(termIdOf(chosen)) : undefined;
  if (!chosen || !offers || !offer) return null;
  if (offer === "offered") return { text: `${code} is offered in ${termLong(chosen)}.`, offered: true };
  const others = [...offers].filter(([, value]) => value === "offered").map(([id]) => parseTerm(id)!).sort(compareTerms).map(termLong);
  return { text: `${code} isn’t offered in ${termLong(chosen)}.${others.length > 0 ? ` It’s offered in ${joined(others)}.` : ""}`, offered: false };
}

export function firstOffered(from: TermName, offers: TermOffers | undefined): TermName {
  if (offers?.get(termIdOf(from)) !== "not-offered") return from;
  const later = [...offers].filter(([, value]) => value === "offered").map(([id]) => parseTerm(id)!).filter((term) => compareTerms(term, from) > 0).sort(compareTerms);
  return later[0] ?? from;
}
