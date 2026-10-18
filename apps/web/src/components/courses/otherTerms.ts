import type { TermFile, TermSummary } from "@/lib/data/types";

/** The open terms, other than the current one, whose file lists this course code. A term that fails to load is skipped. */
export async function termsWithCourse(
  code: string,
  terms: readonly TermSummary[],
  currentTermId: string | null,
  loadTerm: (termId: string) => Promise<TermFile>,
): Promise<TermSummary[]> {
  const found = await Promise.all(
    terms
      .filter((term) => term.id !== currentTermId)
      .map(async (term) => {
        try {
          const file = await loadTerm(term.id);
          return file.courses.some((course) => course.code === code) ? term : null;
        } catch {
          return null;
        }
      }),
  );
  return found.filter((term) => term !== null);
}

/** "C Term", "B Term and C Term", "A Term, B Term and C Term" */
export function joinTermNames(terms: readonly Pick<TermSummary, "name">[]): string {
  const names = terms.map((term) => term.name);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
