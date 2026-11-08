import { expect, it } from "vitest";
import { offering } from "./offerings";
import type { CatalogCourse } from "../catalog";
import type { TermFile } from "@/lib/data/types";

const course = { code: "CS 1101", credits: 3, termLetters: ["A"] } as CatalogCourse;
const term = { letter: "A", year: 2027 } as const;
it("keeps published absence, loading errors, history, and unknown offerings distinct", () => {
  const file = { courses: [] } as unknown as TermFile;
  expect(offering(course, term, { status: "published", file }).state).toBe("absent");
  expect(offering(course, term, { status: "failed" }).state).toBe("failed");
  expect(offering(course, term, { status: "unpublished" }).state).toBe("estimated");
  expect(offering({ ...course, termLetters: [] }, term, { status: "unpublished" }).state).toBe("unknown");
  const published = { courses: [{ ...course, sections: [{ status: "closed", enrolled: 20, capacity: 20 }] }] } as unknown as TermFile;
  expect(offering(course, term, { status: "published", file: published })).toMatchObject({ state: "confirmed", credits: 3 });
  expect(offering(course, term, { status: "published", file: published }).text).toContain("0 with open seats");
});
