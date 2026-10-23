import { expect, it } from "vitest";
import { termFile } from "@/lib/store/testing/fixtures";
import { advanceGuide, guideProgress, professorCourse, type GuideVisit } from "./tutorialSteps";

it("targets the selected lecture course, or the first planned lecture course", () => {
  const term = termFile("2027-C");
  term.courses[2].sections[0].type = "lab";
  expect(professorCourse(term, ["AE 2320", "AE 2410"], "AE 2410")).toBe("AE 2410");
  expect(professorCourse(term, ["AB 1533", "AE 2320", "AE 2410"], "AB 1533")).toBe("AE 2320");
  expect(professorCourse(term, ["AB 1533"], "AB 1533")).toBeNull();
});

it("skips the professor step in both directions and freezes the total until navigation", () => {
  const visit: GuideVisit = { step: "courses", includesProfessor: true };
  expect(guideProgress(visit)).toEqual({ current: 2, total: 5 });
  const availability = advanceGuide(visit, 1, false);
  expect(availability).toEqual({ step: "availability", includesProfessor: false });
  expect(guideProgress(availability)).toEqual({ current: 3, total: 4 });
  expect(advanceGuide(availability, -1, false).step).toBe("courses");
  expect(advanceGuide(visit, 1, true).step).toBe("professor");
});
