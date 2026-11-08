import { expect, it } from "vitest";
import { isOffered, offering } from "./offerings";
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
  const published = { courses: [{ ...course, sections: [{ id: "lecture", status: "closed", enrolled: 20, capacity: 20 }], options: [["lecture"]] }] } as unknown as TermFile;
  expect(offering(course, term, { status: "published", file: published })).toMatchObject({ state: "full", credits: 3 });
  expect(offering(course, term, { status: "published", file: published }).text).toContain("No complete section option");
});

it("does not recommend a published course without a complete open registration option", () => {
  const lecture = { id: "lecture", status: "open", enrolled: 10, capacity: 20 };
  const lab = { id: "lab", status: "open", enrolled: 20, capacity: 20 };
  const value = (sections: unknown[], options: string[][]) => offering(course, term, { status: "published", file: { courses: [{ ...course, sections, options }] } as unknown as TermFile });
  expect(isOffered(value([lecture, lab], [["lecture", "lab"]]))).toBe(false);
  expect(isOffered(value([{ ...lecture, status: "waitlist" }], [["lecture"]]))).toBe(false);
  expect(isOffered(value([lecture, { ...lab, enrolled: 19 }], [["lecture", "lab"]]))).toBe(true);
});
