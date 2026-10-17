import { describe, expect, it } from "vitest";
import { rateMyProfessorsUrl, uniqueInstructors } from "./instructors";

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
