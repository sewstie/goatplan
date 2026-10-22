import { expect, it } from "vitest";
import { sectionSteps } from "./sectionSteps";
import { makeSection, orbitalMechanics } from "./testing/sections";
import { lectureProfessorTerm } from "@/lib/store/testing/lectureProfessors";

const rules = { startsAfter: 0, blocked: [], onlyOpen: true };
const chosen = ["AE 2320-CL01", "AE 2320-CX01"];

it("lists eligible lecture times after the professor filter and labels the lecture lock", () => {
  const course = lectureProfessorTerm().courses[0];
  const result = sectionSteps(course, [...chosen, "AE 2320-CD01"], [], [], { ...rules, startsAfter: 540, professor: "Ye Lu" });
  expect(result.lectures?.choices.map(({ section, reason }) => [section.code, reason])).toEqual([["CL02", null]]);
  expect(result.lectures?.label).toBe("1 other lecture time · Unlocked");
  expect(sectionSteps(course, chosen, [chosen[0]], [], { ...rules, startsAfter: 540 }).lectures?.label).toBe("3 other lecture times · Locked");
});

it("keeps incompatible lectures visible with the locked lab's reason and allows a compatible switch", () => {
  const course = lectureProfessorTerm().courses[0];
  const locks = [chosen[0], "AE 2320-CX02", "AE 2320-CD01"];
  const result = sectionSteps(course, [chosen[0], "AE 2320-CX02", "AE 2320-CD01"], locks, [], { ...rules, startsAfter: 540 });
  expect(result.lectures?.choices.map(({ section, reason }) => [section.code, reason])).toEqual([
    ["CL02", "Doesn't fit locked lab CX02"], ["CL03", "Doesn't fit locked lab CX02"], ["CL04", "Doesn't fit locked lab CX02"],
  ]);
  expect(sectionSteps(course, [...chosen, "AE 2320-CD01"], [...chosen, "AE 2320-CD01"], [], { ...rules, startsAfter: 540 }).lectures?.choices[0].reason).toBeNull();
  expect(locks).toEqual([chosen[0], "AE 2320-CX02", "AE 2320-CD01"]);
});

it("counts a single eligible lecture as done, labels it Only lecture, and hides step 1 without lectures", () => {
  const course = lectureProfessorTerm().courses[0];
  const filtered = sectionSteps(course, ["AE 2320-CL02", "AE 2320-CX01", "AE 2320-CD01"], [], [], { ...rules, professor: "Alex Smith" });
  expect(filtered.lectures?.label).toBe("Only lecture");
  expect(filtered.currentStep).toBe(2);
  expect(sectionSteps(orbitalMechanics, chosen, [], [], rules).lectures?.label).toBe("Only lecture");
  const lab = orbitalMechanics.sections[1];
  expect(sectionSteps({ ...course, sections: [lab], options: [[lab.id]] }, [lab.id], [], [], rules).lectures).toBeNull();
});

it("keeps the sole eligible replacement reachable when a different lecture is locked", () => {
  const course = lectureProfessorTerm().courses[0];
  const result = sectionSteps(course, [...chosen, "AE 2320-CD01"], [chosen[0]], [], { ...rules, professor: "Alex Smith" });
  expect(result.lectures?.label).toBe("1 other lecture time · Locked");
  expect(result.lectures?.choices.map(({ section }) => section.code)).toEqual(["CL02"]);
});

it("offers only other labs that fit the current lecture and the rest of the schedule", () => {
  const course = structuredClone(orbitalMechanics);
  const lecture = makeSection("AE 2320-CL02", { meetings: [{ days: ["Thu"], start: 900, end: 950, location: "" }] });
  course.sections.push(lecture);
  course.options.push([lecture.id, "AE 2320-CX04"]);
  course.options = course.options.filter((option) => !(option.includes(chosen[0]) && option.includes("AE 2320-CX04")));

  const result = sectionSteps(course, chosen, [chosen[0]], [], rules);

  expect(result.currentStep).toBe(2);
  expect(result.labs[0].current.id).toBe("AE 2320-CX01");
  expect(result.labs[0].choices.map((section) => section.code)).toEqual(["CX02"]);
});

it("keeps discussions fixed while choosing labs and labs fixed while choosing discussions", () => {
  const course = structuredClone(orbitalMechanics);
  const discussion = makeSection("AE 2320-D01", { type: "discussion", meetings: [{ days: ["Mon"], start: 720, end: 770, location: "" }] });
  const other = { ...discussion, id: "AE 2320-D02", code: "D02" };
  course.sections.push(discussion, other);
  course.options = course.options.flatMap((option) => [[...option, discussion.id], [...option, other.id]]);
  const ids = [...chosen, discussion.id];

  const result = sectionSteps(course, ids, [chosen[0], discussion.id], [], rules);
  expect(result.labs.map(({ current, choices }) => [current.code, choices.map((section) => section.code)])).toEqual([
    ["CX01", ["CX02", "CX04"]], ["D01", ["D02"]],
  ]);
  expect(result.currentStep).toBe(2);
});

it.each([
  ["blocked time", { ...rules, blocked: [{ day: "Thu" as const, start: 900, end: 960 }] }, []],
  ["other course", rules, [makeSection("AE 2410-C01", { meetings: [{ days: ["Thu"], start: 900, end: 960, location: "" }] })]],
  ["professor choice", { ...rules, professor: "Other Teacher" }, []],
  ["start time", { ...rules, startsAfter: 600 }, []],
])("leaves out labs that break the %s", (_name, fitRules, rest) => {
  expect(sectionSteps(orbitalMechanics, chosen, [], rest, fitRules).labs[0].choices).toEqual([]);
});

it("leaves out closed labs when only open sections is on", () => {
  const course = structuredClone(orbitalMechanics);
  course.sections[2].status = "closed";
  expect(sectionSteps(course, chosen, [], [], rules).labs[0].choices.map((section) => section.code)).toEqual(["CX04"]);
  expect(sectionSteps(course, chosen, [], [], { ...rules, onlyOpen: false }).labs[0].choices.map((section) => section.code)).toEqual(["CX02", "CX04"]);
});

it("offers replacements of the same kind without adding another component", () => {
  const course = structuredClone(orbitalMechanics);
  const discussion = makeSection("AE 2320-D01", { type: "discussion", meetings: [{ days: ["Mon"], start: 720, end: 770, location: "" }] });
  course.sections.push(discussion);
  course.options.push([chosen[0], discussion.id], [chosen[0], "AE 2320-CX02", discussion.id]);
  expect(sectionSteps(course, chosen, [], [], rules).labs[0].choices.map((section) => section.code)).toEqual(["CX02", "CX04"]);
});

it("hides step 2 without labs or discussions and supports courses without lectures", () => {
  const lectureOnly = { ...orbitalMechanics, sections: [orbitalMechanics.sections[0]], options: [[chosen[0]]] };
  expect(sectionSteps(lectureOnly, [chosen[0]], [], [], rules)).toMatchObject({ currentStep: null, labs: [] });
  const labOnly = { ...orbitalMechanics, sections: orbitalMechanics.sections.slice(1), options: orbitalMechanics.sections.slice(1).map((section) => [section.id]) };
  const result = sectionSteps(labOnly, [chosen[1]], [], [], rules);
  expect(result.currentStep).toBe(2);
  expect(result.labs[0].choices.map((section) => section.code)).toEqual(["CX02", "CX04"]);
});

it("returns to the lecture step until a lecture is locked, and finishes after the lab is locked", () => {
  const course = structuredClone(orbitalMechanics);
  const lecture = makeSection("AE 2320-CL02");
  course.sections.push(lecture);
  course.options.push([lecture.id, "AE 2320-CX01"]);

  expect(sectionSteps(course, chosen, [], [], rules).currentStep).toBe(1);
  expect(sectionSteps(course, chosen, [chosen[0]], [], rules).currentStep).toBe(2);
  expect(sectionSteps(course, chosen, chosen, [], rules).currentStep).toBeNull();
  expect(sectionSteps(orbitalMechanics, chosen, [], [], rules).currentStep).toBe(2);
});
