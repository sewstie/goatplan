import type { Course } from "@/lib/data/types";
import { compactCode } from "./courseCode";

export interface SearchEntry {
  course: Course;
  /** "cs2102" */
  code: string;
  /** "2102" */
  number: string;
  /** The title's words joined by spaces, for "starts with" matches. */
  title: string;
  /** Words of the course title and of any section topic titles. */
  titleWords: string[];
  /** Words of each instructor's name. */
  instructors: string[][];
}

/** Lower is better. Ties sort undergraduate courses first, then by code. */
export const SEARCH_RANK = {
  exactCode: 0,
  codePrefix: 1,
  number: 2,
  titleStart: 3,
  titleWords: 4,
  instructor: 5,
  anyField: 6,
} as const;

export interface SearchResult {
  course: Course;
  rank: number;
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function words(text: string): string[] {
  return fold(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function buildSearchIndex(courses: readonly Course[]): SearchEntry[] {
  return courses.map((course) => {
    const code = compactCode(course.code);
    const titles = [course.title, ...course.sections.flatMap((section) => section.title ?? [])];
    const names = new Map<string, string[]>();
    for (const section of course.sections) {
      for (const name of section.instructors) names.set(fold(name), words(name));
    }
    return {
      course,
      code,
      number: code.slice(compactCode(course.subject).length),
      title: words(course.title).join(" "),
      titleWords: [...new Set(titles.flatMap(words))],
      instructors: [...names.values()].filter((name) => name.length > 0),
    };
  });
}

function rank(entry: SearchEntry, compact: string, phrase: string, tokens: string[]): number | null {
  if (entry.code === compact) return SEARCH_RANK.exactCode;
  if (/^[a-z]/.test(compact) && entry.code.startsWith(compact)) return SEARCH_RANK.codePrefix;
  if (/^\d+$/.test(compact) && entry.number.startsWith(compact)) return SEARCH_RANK.number;

  const startsAWord = (list: readonly string[]) => (token: string) => list.some((word) => word.startsWith(token));
  if (entry.title.startsWith(phrase)) return SEARCH_RANK.titleStart;
  if (tokens.every(startsAWord(entry.titleWords))) return SEARCH_RANK.titleWords;
  if (entry.instructors.some((name) => tokens.every(startsAWord(name)))) return SEARCH_RANK.instructor;

  // The number is left out, so "ae 2" doesn't match a course with a title word starting with "ae".
  const everything = [entry.code, ...entry.titleWords, ...entry.instructors.flat()];
  if (tokens.every(startsAWord(everything))) return SEARCH_RANK.anyField;
  return null;
}

const byCode = new Intl.Collator("en", { numeric: true });

/** Matches course codes (with or without the space), titles and instructors, best match first. */
export function searchCourses(index: readonly SearchEntry[], query: string): SearchResult[] {
  const tokens = words(query);
  if (tokens.length === 0) return [];
  const compact = compactCode(query);
  const phrase = tokens.join(" ");

  const results: SearchResult[] = [];
  for (const entry of index) {
    const found = rank(entry, compact, phrase, tokens);
    if (found !== null) results.push({ course: entry.course, rank: found });
  }
  return results.sort(
    (a, b) =>
      a.rank - b.rank ||
      Number(a.course.level === "Graduate") - Number(b.course.level === "Graduate") ||
      byCode.compare(a.course.code, b.course.code),
  );
}

function sharedPrefixLength(a: string, b: string): number {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length += 1;
  return length;
}

/** A real code to suggest after a search with no results: the closest code in the same subject, if any. */
export function suggestCourseCode(query: string, courses: readonly Course[]): string | null {
  if (courses.length === 0) return null;
  const compact = compactCode(query);
  const subject = /^[a-z]+/.exec(compact)?.[0] ?? "";
  const number = compact.slice(subject.length);

  let best: Course | null = null;
  let bestLength = -1;
  for (const course of courses) {
    if (compactCode(course.subject) !== subject) continue;
    const length = sharedPrefixLength(compactCode(course.code).slice(subject.length), number);
    if (length > bestLength) {
      best = course;
      bestLength = length;
    }
  }
  return (best ?? courses[0]).code;
}
