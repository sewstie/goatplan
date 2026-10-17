import { describe, expect, it } from "vitest";
import { sectionLabel, sectionTypeName } from "./sections";
import type { SectionType } from "./types";

describe("sectionLabel", () => {
  it.each<[string, SectionType, string]>([
    ["BS02", "discussion", "BS02 discussion"],
    ["CL01", "lecture", "CL01 lecture"],
    ["CX02", "lab", "CX02 lab"],
    ["S01", "seminar", "S01 seminar"],
    ["W01", "workshop", "W01 workshop"],
    ["X01", "other", "X01"],
  ])("%s %s → %s", (code, type, expected) => {
    expect(sectionLabel({ code, type })).toBe(expected);
  });

  it("keeps code suffixes", () => {
    expect(sectionLabel({ code: "BX03-A", type: "lab" })).toBe("BX03-A lab");
  });
});

describe("sectionTypeName", () => {
  it("capitalizes the type", () => {
    expect(sectionTypeName("lecture")).toBe("Lecture");
    expect(sectionTypeName("lab")).toBe("Lab");
    expect(sectionTypeName("other")).toBe("Section");
  });
});
