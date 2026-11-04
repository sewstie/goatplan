import type { Course, Section, Term } from "@/lib/data/types";

/** "C Term · Spring 2027" */
export function termFieldLabel(term: Pick<Term, "name" | "season" | "year">): string {
  return `${term.name} · ${term.season} ${term.year}`;
}

/** "1 course", "3 courses" */
export function courseCount(count: number): string {
  return `${count} ${count === 1 ? "course" : "courses"}`;
}

/** The sections a planned course counts credits from: the current schedule's, else the only option, else the locked ones. */
export function rowSections(course: Course, chosen: readonly string[] | undefined, locked: readonly string[] | undefined): Section[] {
  const ids = chosen?.length ? chosen : course.options.length === 1 ? course.options[0] : (locked ?? []);
  return ids.flatMap((id) => course.sections.find((section) => section.id === id) ?? []);
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
