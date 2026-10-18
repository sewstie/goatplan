import { describe, expect, it } from "vitest";
import { COURSE_COLORS, courseSlot } from "./courseColors";

describe("courseSlot", () => {
  it("follows the order courses were added and repeats after four", () => {
    const courses = ["AE 2320", "AE 2410", "AE 2210", "MA 1023", "PH 1110"];
    expect(courses.map((code) => courseSlot(courses, code))).toEqual([1, 2, 3, 4, 1]);
    expect(courseSlot(courses, "ZZ 9999")).toBe(1);
  });

  it("gives the sidebar swatch and the calendar block the same color", () => {
    expect(COURSE_COLORS[2].swatch).toBe("bg-course-2-swatch");
    expect(COURSE_COLORS[2].block).toContain("bg-course-2 ");
  });
});
