import type { Section } from "./types";

/** Worcester Polytechnic Institute on Rate My Professors (ratemyprofessors.com/school/1220). */
const RATE_MY_PROFESSORS_SCHOOL_ID = 1220;

export function rateMyProfessorsUrl(name: string): string {
  const query = encodeURIComponent(name.trim());
  return `https://www.ratemyprofessors.com/search/professors/${RATE_MY_PROFESSORS_SCHOOL_ID}?q=${query}`;
}

export function hasInstructor(section: Pick<Section, "instructors">, name: string): boolean {
  const key = name.trim().toLowerCase();
  return section.instructors.some((instructor) => instructor.trim().toLowerCase() === key);
}

export function lecturesByProfessor(sections: readonly Section[], name: string): Section[] {
  return sections.filter((section) => section.type === "lecture" && hasInstructor(section, name));
}

export function lectureInstructors(sections: readonly Section[]): string[] {
  return uniqueInstructors(sections.filter((section) => section.type === "lecture"));
}

export function lectureInstructorChoices(sections: readonly Section[]) {
  return lectureInstructors(sections).map((name) => {
    const lectures = lecturesByProfessor(sections, name);
    return {
      name,
      lectureCount: lectures.length,
      coTaughtCount: lectures.filter((section) => uniqueInstructors([section]).length > 1).length,
    };
  });
}

/** Labs and discussions often list the wrong person, so only lectures and other sections show who teaches them. */
export function showsInstructor(section: Pick<Section, "type">): boolean {
  return section.type !== "lab" && section.type !== "discussion";
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
