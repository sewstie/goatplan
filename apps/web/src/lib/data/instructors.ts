import type { Section } from "./types";

/** Worcester Polytechnic Institute on Rate My Professors (ratemyprofessors.com/school/1220). */
const RATE_MY_PROFESSORS_SCHOOL_ID = 1220;

export function rateMyProfessorsUrl(name: string): string {
  const query = encodeURIComponent(name.trim());
  return `https://www.ratemyprofessors.com/search/professors/${RATE_MY_PROFESSORS_SCHOOL_ID}?q=${query}`;
}

/** Every instructor once, in the order they first appear, ignoring blanks and case. */
export function uniqueInstructors(sections: readonly Pick<Section, "instructors">[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const section of sections) {
    for (const raw of section.instructors) {
      const name = raw.trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    }
  }
  return names;
}
