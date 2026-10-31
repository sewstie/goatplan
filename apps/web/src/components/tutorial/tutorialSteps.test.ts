import { expect, it } from "vitest";
import { termFile } from "@/lib/store/testing/fixtures";
import { advanceGuide, guideContent, guideProgress, professorCourse, type GuideVisit } from "./tutorialSteps";

it("targets the selected course with a professor choice, or the first planned one", () => {
  const term = termFile("2027-C");
  for (const course of term.courses.slice(0, 3)) course.sections.push({ ...course.sections[0], id: `${course.code}-X`, instructors: ["Alex Rivera"] });
  term.courses[2].sections.forEach((section) => { section.type = "lab"; });
  expect(professorCourse(term, ["AE 2320", "AE 2410"], "AE 2410")).toBe("AE 2410");
  expect(professorCourse(term, ["AB 1533", "AE 2320", "AE 2410"], "AB 1533")).toBe("AE 2320");
  expect(professorCourse(term, ["AB 1533"], "AB 1533")).toBeNull();
});

it("skips a course whose lectures all have the same professor", () => {
  expect(professorCourse(termFile("2027-C"), ["AE 2320", "AE 2410"], "AE 2320")).toBeNull();
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

it("asks for a course in step 2 until there is one", () => {
  expect(guideContent("courses").hint).toBe("Add at least one course to continue.");
  expect(guideContent("courses", { hasCourses: true }).hint).toBe("Great — press Next");
});

it("teaches drawing in step 4 and points at the Block a time button", () => {
  const { body, target } = guideContent("availability");
  expect(body).toBe("Press Block a time, then drag on the calendar to mark when you’re busy. Drag on a blocked time to erase it.");
  expect(target).toBe("tutorial-block-time");
  expect(guideContent("availability", { phone: true }).body).toBe("Tap Block time, then drag on the calendar to mark when you’re busy. Drag on a blocked time to erase it.");
});

it("offers the professor step in plain words", () => {
  expect(guideContent("professor").body).toBe("Want a specific professor? Pick them here to see only their lectures. Any professor keeps every option.");
});

it("names no cause in the no-match step and points at the diagnosis", () => {
  const { body, target } = guideContent("schedules", { noMatches: true });
  expect(body).toBe("Nothing fits right now. The panel shows why and offers fixes — finish the guide and pick one when you’re ready.");
  expect(target).toBe("tutorial-diagnosis");
});

it("uses the phone's own wording for finding sections on the last step", () => {
  expect(guideContent("schedules").body).toContain("The course panel lists this timetable’s lecture, lab and discussion IDs.");
  const phone = guideContent("schedules", { phone: true }).body;
  expect(phone).toContain("Tap a class or a course chip to see its sections.");
  expect(phone).not.toContain("course panel");
});
