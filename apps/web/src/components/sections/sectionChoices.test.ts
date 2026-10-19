import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/data/types";
import { choiceDetail, sectionChoices } from "./sectionChoices";
import { makeSection, orbitalMechanics } from "./testing/sections";

const rules = { startsAfter: 0, blocked: [], onlyOpen: true };
const chosen = ["AE 2320-CL01", "AE 2320-CX02"];

/** Another course's section that meets on Thursday at this time. */
const busyThursday = (start: number, end: number) =>
  makeSection("AE 2410-C01", { meetings: [{ days: ["Thu"], start, end, location: "Higgins Labs 116" }] });

describe("sectionChoices", () => {
  it("keeps other choices within the selected professor's sections", () => {
    const course = structuredClone(orbitalMechanics);
    for (const section of course.sections) section.instructors = ["Someone Else"];
    course.sections.find((section) => section.code === "CX02")!.instructors = ["Chosen Professor"];
    course.sections.find((section) => section.code === "CX04")!.instructors = ["Chosen Professor"];
    expect(sectionChoices(course, chosen, [], { ...rules, professor: "chosen professor" })?.others.map((choice) => choice.label)).toEqual(["CX04"]);
  });
  it("lists the course's other labs that fit, with their times, rooms and seats", () => {
    const choices = sectionChoices(orbitalMechanics, chosen, [], rules)!;
    expect(choices.kind).toBe("lab");
    expect(choices.current).toMatchObject({ label: "CX02", times: "Thu · 3:00 PM–3:50 PM", openSeats: 4 });
    const rows = choices.others.map(({ label, times, sharesTime, openSeats }) => ({ label, times, sharesTime, openSeats }));
    expect(rows).toEqual([
      { label: "CX01", times: "Thu · 2:00 PM–2:50 PM", sharesTime: false, openSeats: 4 },
      { label: "CX04", times: "Thu · 3:00 PM–3:50 PM", sharesTime: true, openSeats: 20 },
    ]);
    expect(choiceDetail(choices.others[1])).toBe("Thu · 3:00 PM–3:50 PM · Higgins Labs 231");
    expect(choiceDetail(choices.current)).toBe("Thu · 3:00 PM–3:50 PM · Higgins Labs 230");
    expect(choices.others[1].sectionIds).toEqual(["AE 2320-CL01", "AE 2320-CX04"]);
    expect(choices.suggested.label).toBe("CX04");
  });

  it("leaves out labs that overlap the rest of the schedule, in the engine's 5-minute slots", () => {
    const labels = (start: number, end: number) =>
      sectionChoices(orbitalMechanics, chosen, [busyThursday(start, end)], rules)?.others.map((choice) => choice.label);
    expect(labels(860, 880)).toEqual(["CX04"]);
    expect(labels(890, 900)).toEqual(["CX01", "CX04"]);
    expect(labels(888, 900)).toEqual(["CX04"]);
  });

  it("leaves out labs the preferences rule out: blocked times and full sections", () => {
    expect(
      sectionChoices(orbitalMechanics, chosen, [], { ...rules, blocked: [{ day: "Thu", start: 840, end: 870 }] })?.others,
    ).toHaveLength(1);
    const full: Course = {
      ...orbitalMechanics,
      sections: orbitalMechanics.sections.map((section) =>
        section.code === "CX04" ? { ...section, status: "closed", enrolled: 40 } : section,
      ),
    };
    expect(sectionChoices(full, chosen, [], rules)?.others.map((choice) => choice.label)).toEqual(["CX01"]);
    expect(sectionChoices(full, chosen, [], { ...rules, onlyOpen: false })?.others.map((choice) => choice.openSeats)).toEqual([4, 0]);
  });

  it("is null when nothing else fits or the chosen sections aren't an option", () => {
    expect(sectionChoices(orbitalMechanics, chosen, [busyThursday(840, 960)], rules)).toBeNull();
    const onlyOne: Course = { ...orbitalMechanics, options: [chosen] };
    expect(sectionChoices(onlyOne, chosen, [], rules)).toBeNull();
    expect(sectionChoices(orbitalMechanics, ["AE 2320-CX02"], [], rules)).toBeNull();
  });

  it("names every section that changes when more than the lab does", () => {
    const course: Course = {
      ...orbitalMechanics,
      sections: [
        ...orbitalMechanics.sections,
        makeSection("AE 2320-CL02", { meetings: [{ days: ["Mon"], start: 600, end: 650, location: "Unity Hall 500" }] }),
      ],
      options: [...orbitalMechanics.options, ["AE 2320-CL02", "AE 2320-CX01"]],
    };
    const choices = sectionChoices(course, chosen, [], rules)!;
    expect(choices.kind).toBe("section");
    expect(choices.others.map((choice) => choice.label)).toEqual(["CL01 · CX01", "CL01 · CX04", "CL02 · CX01"]);
  });
});
