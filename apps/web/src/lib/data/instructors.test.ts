import { describe, expect, it } from "vitest";
import { lectureInstructorChoices, rateMyProfessorsUrl, showsInstructor, uniqueInstructors } from "./instructors";
import { lectureProfessorTerm } from "../store/testing/lectureProfessors";

it("counts all lecture times for each co-teacher, ignoring other sections and duplicate names", () => {
  const sections = lectureProfessorTerm().courses[0].sections;
  sections[1].instructors.push("Alex Smith", " ");
  expect(lectureInstructorChoices(sections)).toEqual([
    { name: "Ye Lu", lectureCount: 4, coTaughtCount: 1 },
    { name: "Alex Smith", lectureCount: 1, coTaughtCount: 1 },
    { name: "Mark Richman", lectureCount: 2, coTaughtCount: 0 },
  ]);
});

it("shows who teaches lectures and other sections, but not labs or discussions", () => {
  expect(showsInstructor({ type: "lecture" })).toBe(true);
  expect(showsInstructor({ type: "other" })).toBe(true);
  expect(showsInstructor({ type: "lab" })).toBe(false);
  expect(showsInstructor({ type: "discussion" })).toBe(false);
});

describe("rateMyProfessorsUrl", () => {
  it("searches WPI professors by name", () => {
    expect(rateMyProfessorsUrl("Ye Lu")).toBe(
      "https://www.ratemyprofessors.com/search/professors/1220?q=Ye%20Lu",
    );
  });

  it("encodes the name and trims it", () => {
    expect(rateMyProfessorsUrl("  Mohammed El Hamzaoui ")).toBe(
      "https://www.ratemyprofessors.com/search/professors/1220?q=Mohammed%20El%20Hamzaoui",
    );
    expect(rateMyProfessorsUrl("Anne-Marie O'Neil & Co")).toContain("q=Anne-Marie%20O'Neil%20%26%20Co");
  });
});

describe("uniqueInstructors", () => {
  it("lists each instructor once, in first-seen order", () => {
    const sections = [
      { instructors: ["Ye Lu"] },
      { instructors: ["Ye Lu", "Mark Richman"] },
      { instructors: ["David Olinger", "mark richman"] },
    ];
    expect(uniqueInstructors(sections)).toEqual(["Ye Lu", "Mark Richman", "David Olinger"]);
  });

  it("skips sections without instructors and blank names", () => {
    expect(uniqueInstructors([{ instructors: [] }, { instructors: ["  ", " Ye Lu "] }])).toEqual(["Ye Lu"]);
    expect(uniqueInstructors([])).toEqual([]);
  });
});
