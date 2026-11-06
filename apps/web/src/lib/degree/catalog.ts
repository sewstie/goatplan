import type { Course } from "@/lib/data/types";

export interface CatalogCourse extends Course {
  offeredThisYear: boolean;
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

export function findCourse(courses: readonly Course[], code: string): Course | undefined {
  return courses.find((course) => course.code === code);
}
