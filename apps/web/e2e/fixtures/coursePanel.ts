import type { Course, TermFile } from "../../src/lib/data/types";
import { makeSection, orbitalMechanics } from "../../src/components/sections/testing/sections";
import { termFile } from "../../src/lib/store/testing/fixtures";

export function coursePanelTerm(state: "04" | "07" | "24" | "29"): TermFile {
  const term = termFile("2027-C");
  term.term = { ...term.term, name: "C Term 2027", season: "Spring", start: "2027-01-13", end: "2027-03-05" };
  const ae = structuredClone(orbitalMechanics);
  const standalone = (code: string, title: string, instructor: string, start: number, location: string): Course => ({
    ...ae, code, subject: code.split(" ")[0], title,
    sections: [makeSection(`${code}-C01`, { instructors: [instructor], meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start, end: start + 50, location }] })],
    options: [[`${code}-C01`]],
  });
  term.courses = [
    ae,
    standalone("AE 2410", "Introduction to Aerospace Structures", "Mark Richman", 600, "Higgins Labs 116"),
    standalone("AE 2210", "Introduction to Thermal Engineering", "David Olinger", 660, "Higgins Labs 202"),
    standalone("AB 1533", "Elementary Arabic III", "Mohammed El Hamzaoui", 540, "Salisbury Labs 115"),
  ];
  if (state === "04") {
    term.courses[1].sections[0].enrolled = 120;
    term.courses[1].sections[0].status = "closed";
  }
  if (state === "04" || state === "07") return term;

  const demo: Course = { ...ae, code: "DEMO 1001", subject: "DEMO", title: "Engineering Seminar", sections: [
    makeSection("DEMO 1001-L01", { capacity: 40, enrolled: 22, instructors: ["Alex Rivera"], meetings: [{ days: ["Tue", "Thu"], start: 480, end: 530, location: "Example Hall 101" }] }),
    makeSection("DEMO 1001-L02", { capacity: 40, enrolled: 22, instructors: ["Jordan Lee"], meetings: [{ days: ["Tue", "Thu"], start: 600, end: 650, location: "Example Hall 102" }] }),
    makeSection("DEMO 1001-B01", { type: "lab", capacity: 24, enrolled: 16, instructors: ["Sam Patel"], meetings: [{ days: ["Fri"], start: 900, end: 950, location: "Example Lab 202" }] }),
    makeSection("DEMO 1001-B02", { type: "lab", capacity: 24, enrolled: 16, instructors: ["Sam Patel"], meetings: [{ days: ["Fri"], start: 840, end: 890, location: "Example Lab 202" }] }),
    makeSection("DEMO 1001-D01", { type: "discussion", capacity: 24, enrolled: 16, instructors: ["Riley Chen"], meetings: [{ days: ["Mon"], start: 840, end: 890, location: "Example Hall 103" }] }),
  ], options: [
    ["DEMO 1001-L01", "DEMO 1001-B01", "DEMO 1001-D01"],
    ["DEMO 1001-L01", "DEMO 1001-B02", "DEMO 1001-D01"],
    ["DEMO 1001-L02", "DEMO 1001-B01", "DEMO 1001-D01"],
    ["DEMO 1001-L02", "DEMO 1001-B02", "DEMO 1001-D01"],
  ] };
  term.instructors = { "Alex Rivera": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
  term.courses = [demo];
  if (state === "29") {
    demo.code = "DEMO 2001";
    demo.title = "Robotics Laboratory";
    demo.sections = ["B01", "B02"].map((code) => makeSection(`DEMO 2001-${code}`, {
      type: "lab", capacity: 24, enrolled: 16, instructors: ["Sam Patel"],
      meetings: [{ days: ["Thu"], start: 840, end: 890, location: "Example Lab 202" }],
    }));
    demo.options = demo.sections.map((section) => [section.id]);
  }
  return term;
}
