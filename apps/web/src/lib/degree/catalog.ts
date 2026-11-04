import { loadTerm, loadTermIndex } from "@/lib/data/load";
import type { Course, TermFile, TermIndex } from "@/lib/data/types";

export interface Catalog {
  courses: Course[];
  complete: boolean;
}

interface CatalogDeps {
  loadTermIndex(): Promise<TermIndex>;
  loadTerm(termId: string): Promise<TermFile>;
}

export async function loadCatalog(deps: CatalogDeps = { loadTermIndex, loadTerm }): Promise<Catalog> {
  let terms: TermIndex["terms"];
  try {
    ({ terms } = await deps.loadTermIndex());
  } catch {
    return { courses: [], complete: false };
  }
  const newestFirst = [...terms].sort((a, b) => b.start.localeCompare(a.start));
  const files = await Promise.allSettled(newestFirst.map((term) => deps.loadTerm(term.id)));

  const courses = new Map<string, Course>();
  for (const file of files) {
    if (file.status !== "fulfilled") continue;
    for (const course of file.value.courses) {
      if (!courses.has(course.code)) courses.set(course.code, course);
    }
  }
  return { courses: [...courses.values()], complete: files.every((file) => file.status === "fulfilled") };
}

export function findCourse(courses: readonly Course[], code: string): Course | undefined {
  return courses.find((course) => course.code === code);
}
