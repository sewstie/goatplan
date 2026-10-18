import { describe, expect, it, vi } from "vitest";
import type { TermFile, TermSummary } from "@/lib/data/types";
import { joinTermNames, termsWithCourse } from "./otherTerms";
import { ae2320, cs2102 } from "./testing/courses";

function summary(id: string, name: string): TermSummary {
  return {
    id,
    name,
    season: "Spring",
    year: 2027,
    start: "2027-01-13",
    end: "2027-03-05",
    status: "upcoming",
    courses: 1,
    sections: 1,
    generatedAt: "2026-10-17T12:52:39Z",
  };
}

const terms = [summary("2026-B", "B Term"), summary("2027-C", "C Term"), summary("2027-D", "D Term")];

function file(id: string, courses: TermFile["courses"]): TermFile {
  return { term: summary(id, id), generatedAt: "2026-10-17T12:52:39Z", courses };
}

describe("termsWithCourse", () => {
  it("finds the other terms that list the course, skipping the current one", async () => {
    const loadTerm = vi.fn(async (id: string) =>
      id === "2027-C" ? file(id, [ae2320]) : id === "2026-B" ? file(id, [cs2102]) : file(id, []),
    );
    const found = await termsWithCourse("AE 2320", terms, "2027-D", loadTerm);
    expect(found.map((term) => term.id)).toEqual(["2027-C"]);
    expect(loadTerm).not.toHaveBeenCalledWith("2027-D");
  });

  it("skips terms that fail to load", async () => {
    const loadTerm = vi.fn(async (id: string) => {
      if (id === "2026-B") throw new Error("offline");
      return file(id, [ae2320]);
    });
    const found = await termsWithCourse("AE 2320", terms, null, loadTerm);
    expect(found.map((term) => term.id)).toEqual(["2027-C", "2027-D"]);
  });
});

describe("joinTermNames", () => {
  it("joins names in plain English", () => {
    expect(joinTermNames([])).toBe("");
    expect(joinTermNames([{ name: "C Term" }])).toBe("C Term");
    expect(joinTermNames([{ name: "B Term" }, { name: "C Term" }])).toBe("B Term and C Term");
    expect(joinTermNames([{ name: "A Term" }, { name: "B Term" }, { name: "C Term" }])).toBe("A Term, B Term and C Term");
  });
});
