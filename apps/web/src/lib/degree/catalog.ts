import type { Course } from "@/lib/data/types";
import { parseTerm, termLong } from "./terms";

export interface CatalogCourse extends Course {
  lastOffered: string | null;
  termLetters: string[];
}

export interface Catalog {
  courses: CatalogCourse[];
  complete: boolean;
}

export async function loadCatalog(read: typeof fetch = fetch): Promise<Catalog> {
  try {
    const response = await read("/data/catalog.json");
    if (!response.ok) throw new Error("Catalog unavailable");
    const { courses } = await response.json() as { courses: Omit<CatalogCourse, "subject" | "description" | "sections" | "options">[] };
    return {
      courses: courses.map((course) => ({ ...course, subject: course.code.split(" ")[0], description: "", sections: [], options: [] })),
      complete: true,
    };
  } catch {
    return { courses: [], complete: false };
  }
}

const yearLabel = (year: number) => `${year}–${String(year + 1).slice(-2)}`;

export function offeringNote(course: Pick<CatalogCourse, "lastOffered">, today = new Date()): string | null {
  const thisYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  const last = parseTerm(course.lastOffered);
  if (!last) return `Not offered in ${yearLabel(thisYear)}`;
  const lastYear = last.letter === "A" || last.letter === "B" ? last.year : last.year - 1;
  return lastYear < thisYear ? `Last offered in ${termLong(last)}` : null;
}

export function findCourse(courses: readonly Course[], code: string): Course | undefined {
  return courses.find((course) => course.code === code);
}
