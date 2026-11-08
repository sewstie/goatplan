import type { TermFile } from "@/lib/data/types";
import type { CatalogCourse } from "../catalog";
import type { TermName } from "../terms";

export type OfferingInput = { status: "published"; file: TermFile } | { status: "unpublished" } | { status: "failed" };
export interface Offering { state: "confirmed" | "estimated" | "absent" | "unknown" | "failed"; text: string; credits: number | null }
export const termId = (term: TermName) => `${term.year}-${term.letter}`;
export function offering(course: CatalogCourse, term: TermName, input: OfferingInput | undefined): Offering {
  if (!input || input.status === "failed") return { state: "failed", text: "Couldn’t check this term’s classes. Suggest again to retry.", credits: course.credits };
  if (input.status === "published") {
    const found = input.file.courses.find((item) => item.code === course.code && item.sections.length > 0);
    if (!found) return { state: "absent", text: "Not offered this term.", credits: course.credits };
    const open = found.sections.filter((section) => section.status === "open" && section.capacity > section.enrolled).length;
    return { state: "confirmed", text: `Offered this term: ${found.sections.length} ${found.sections.length === 1 ? "section" : "sections"}, ${open} with open seats.`, credits: found.credits };
  }
  return { state: course.termLetters.includes(term.letter) ? "estimated" : "unknown", text: course.termLetters.includes(term.letter) ? `Usually offered in ${term.letter} term. Not confirmed yet.` : "Not sure when it’s offered.", credits: course.credits };
}
