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
  expect(guideContent("courses").hint).toBe("Add a course to continue.");
  expect(guideContent("courses", { hasCourses: true }).hint).toBeUndefined();
});

it("teaches drawing in step 4 and points at the Block a time button", () => {
  const { body, target } = guideContent("availability");
  expect(body).toBe("Click Block a time, then drag across your busy hours.");
  expect(target).toBe("tutorial-block-time");
  expect(guideContent("availability", { phone: true }).body).toBe("Tap Block time, then drag across your busy hours.");
});

it("offers the professor step in plain words", () => {
  expect(guideContent("professor")).toMatchObject({ title: "Prefer a professor?", body: "Optional. Pick one to see only their lectures." });
});

it("names no cause in the no-match step and points at the diagnosis", () => {
  const { title, body, target } = guideContent("schedules", { noMatches: true });
  expect(title).toBe("Nothing fits yet");
  expect(body).toBe("The panel shows why and suggests fixes.");
  expect(target).toBe("tutorial-diagnosis");
});

it("gives no hint on the last two steps", () => {
  for (const content of [guideContent("availability"), guideContent("schedules"), guideContent("schedules", { noMatches: true })]) {
    expect(content).not.toHaveProperty("hint");
  }
});

it("says how to get section codes on the last step", () => {
  expect(guideContent("schedules")).toMatchObject({
    title: "Compare and save",
    body: "Flip through schedules with the arrows. Save one to get section codes for Workday.",
  });
});
