import { describe, expect, it, vi } from "vitest";
import type { Course, TermFile, TermIndex, TermSummary } from "@/lib/data/types";
import { findCourse, loadCatalog } from "./catalog";

const term = (id: string, start: string) => ({ id, start }) as TermSummary;
const course = (code: string, title = code) => ({ code, title, credits: 3 }) as Course;
const file = (...courses: Course[]) => ({ courses }) as TermFile;
const index = (...terms: TermSummary[]) => async () => ({ terms }) as TermIndex;

describe("loadCatalog", () => {
  it("covers every published term, including one that has ended", async () => {
    const loadTerm = vi.fn(async (id: string) => file(course(id === "2020-A" ? "CS 1005" : "MA 1021")));
    const catalog = await loadCatalog({ loadTermIndex: index(term("2020-A", "2020-08-20"), term("2027-C", "2027-01-13")), loadTerm });
    expect(catalog.complete).toBe(true);
    expect(catalog.courses.map((item) => item.code).sort()).toEqual(["CS 1005", "MA 1021"]);
  });

  it("lists a course in several terms once, from the newest term", async () => {
    const loadTerm = async (id: string) => file(course("MA 1021", id));
    const catalog = await loadCatalog({ loadTermIndex: index(term("2026-B", "2026-10-19"), term("2027-C", "2027-01-13")), loadTerm });
    expect(catalog.courses).toEqual([course("MA 1021", "2027-C")]);
  });

  it("keeps the terms that load when another fails", async () => {
    const loadTerm = async (id: string) => {
      if (id === "2026-B") throw new Error("gone");
      return file(course("MA 1021"));
    };
    const catalog = await loadCatalog({ loadTermIndex: index(term("2026-B", "2026-10-19"), term("2027-C", "2027-01-13")), loadTerm });
    expect(catalog.complete).toBe(false);
    expect(catalog.courses.map((item) => item.code)).toEqual(["MA 1021"]);
  });

  it("is empty when the term list can't load", async () => {
    const loadTermIndex = async () => {
      throw new Error("offline");
    };
    await expect(loadCatalog({ loadTermIndex, loadTerm: vi.fn() })).resolves.toEqual({ courses: [], complete: false });
  });
});

describe("findCourse", () => {
  it("finds an exact code only", () => {
    const courses = [course("CS 2102"), course("CS 2103")];
    expect(findCourse(courses, "CS 2103")).toBe(courses[1]);
    expect(findCourse(courses, "CS 21")).toBeUndefined();
  });
});
