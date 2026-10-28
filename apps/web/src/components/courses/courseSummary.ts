import { sectionTypeName, showsInstructor, uniqueInstructors } from "@/lib/data";
import type { Course, Section, SectionType, Term } from "@/lib/data/types";

/** "C Term · Spring 2027" */
export function termFieldLabel(term: Pick<Term, "name" | "season" | "year">): string {
  return `${term.name} · ${term.season} ${term.year}`;
}

/** "1 course", "3 courses" */
export function courseCount(count: number): string {
  return `${count} ${count === 1 ? "course" : "courses"}`;
}

function typeCount(type: SectionType, count: number): string {
  const name = sectionTypeName(type).toLowerCase();
  return `${count} ${name}${count === 1 ? "" : "s"}`;
}

/** "1 lecture · David Olinger", "1 lecture · 3 labs · Ye Lu". Lectures come first. */
export function courseMeta(course: Pick<Course, "sections">): string {
  const counts = new Map<SectionType, number>();
  for (const section of [...course.sections].sort((a, b) => Number(b.type === "lecture") - Number(a.type === "lecture"))) {
    counts.set(section.type, (counts.get(section.type) ?? 0) + 1);
  }
  const names = uniqueInstructors(course.sections.filter(showsInstructor));
  const people =
    names.length === 0
      ? "Instructor not assigned yet"
      : names.length <= 2
        ? names.join(", ")
        : `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  return [...[...counts].map(([type, count]) => typeCount(type, count)), people].join(" · ");
}

/** The sections a planned course row describes: the current schedule's, else the only option, else the locked ones. */
export function rowSections(course: Course, chosen: readonly string[] | undefined, locked: readonly string[] | undefined): Section[] {
  const ids = chosen?.length ? chosen : course.options.length === 1 ? course.options[0] : (locked ?? []);
  return ids.flatMap((id) => course.sections.find((section) => section.id === id) ?? []);
}

/** "CL01 · Lab CX02": lectures by code, other sections by type and code. "C02 · Instructor pending" when nobody teaches them yet. */
export function sectionsLine(sections: readonly Section[]): string {
  if (sections.length === 0) return "";
  const parts = sections.map((section) =>
    section.type === "lecture" || section.type === "other" ? section.code : `${sectionTypeName(section.type)} ${section.code}`,
  );
  if (sections.every((section) => section.instructors.length === 0)) parts.push("Instructor pending");
  return parts.join(" · ");
}

/** A section's own credits win over the course's (zero-credit ensemble sections). Null when WPI lists none. */
export function courseCredits(course: Pick<Course, "credits">, sections: readonly Section[]): number | null {
  const own = sections.find((section) => section.credits !== undefined);
  return own ? (own.credits ?? null) : course.credits;
}

/** "9 credits", "1 credit", "3.75 credits" */
export function formatCredits(credits: number): string {
  const rounded = Math.round(credits * 100) / 100;
  return `${rounded} ${rounded === 1 ? "credit" : "credits"}`;
}
