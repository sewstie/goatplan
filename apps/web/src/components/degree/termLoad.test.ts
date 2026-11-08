import { describe, expect, it } from "vitest";
import { typedCourse } from "@/lib/degree/history";
import type { Choice } from "@/lib/degree/recommendations/planner";
import { termLoad } from "./termLoad";

const choice = (code: string, credits = 3) => ({ course: { ...typedCourse(code), credits } }) as Choice;

describe("term load", () => {
  it("counts courses already in the term and only ticked suggestions", () => {
    const row = { existing: [choice("CS 1101")], additions: [choice("CS 2022"), choice("CS 2102")] };
    expect(termLoad(row, ["CS 2022"], 9)).toEqual({ label: "2 courses · ⅔ unit", fill: 67, over: false });
  });

  it("says one course and an empty term in plain words", () => {
    expect(termLoad({ existing: [choice("CS 1101")], additions: [] }, [], 9).label).toBe("1 course · ⅓ unit");
    expect(termLoad({ existing: [], additions: [] }, [], 9).label).toBe("No courses yet");
  });

  it("flags a term over the limit", () => {
    expect(termLoad({ existing: [choice("CS 1101"), choice("CS 2022"), choice("CS 2102"), choice("CS 2103")], additions: [] }, [], 9).over).toBe(true);
  });
});
