import type { Section, TermFile } from "../../data/types";

export function lectureProfessorTerm(): TermFile {
  const section = (code: string, type: Section["type"], start: number, instructors: string[], day: "Mon" | "Tue" | "Wed" = "Mon"): Section => ({
    id: `AE 2320-${code}`, code, type, status: "open", enrolled: 10, capacity: 40,
    waitlist: { taken: 0, capacity: 0 }, delivery: "in-person", instructors,
    meetings: [{ days: [day], start, end: start + 50, location: "Unity Hall 400" }],
  });
  return {
    term: { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
    generatedAt: "2026-10-20T12:00:00Z",
    courses: [{
      code: "AE 2320", subject: "AE", title: "Introduction to Orbital Mechanics", credits: 3,
      level: "Undergraduate", description: "",
      sections: [
        section("CL01", "lecture", 540, ["Ye Lu"]),
        section("CL02", "lecture", 600, ["Alex Smith", " ye lu "]),
        section("CL03", "lecture", 660, ["Mark Richman"]),
        section("CL04", "lecture", 720, ["Mark Richman"]),
        section("CL05", "lecture", 480, ["Ye Lu"]),
        { ...section("CL06", "lecture", 780, ["Ye Lu"]), status: "closed", enrolled: 40 },
        section("CX01", "lab", 600, ["Lab Tutor"], "Tue"),
        section("CX02", "lab", 600, ["Second Tutor"], "Tue"),
        section("CX03", "lab", 660, ["Ye Lu"], "Tue"),
        section("CX04", "lab", 720, ["Lab Tutor"], "Tue"),
        section("CD01", "discussion", 540, ["Discussion Tutor"], "Wed"),
      ],
      options: [
        ["AE 2320-CL01", "AE 2320-CX01", "AE 2320-CD01"],
        ["AE 2320-CL01", "AE 2320-CX02", "AE 2320-CD01"],
        ["AE 2320-CL02", "AE 2320-CX01", "AE 2320-CD01"],
        ["AE 2320-CL02", "AE 2320-CX04", "AE 2320-CD01"],
        ["AE 2320-CL03", "AE 2320-CX03", "AE 2320-CD01"],
        ["AE 2320-CL04", "AE 2320-CX03", "AE 2320-CD01"],
        ["AE 2320-CL05", "AE 2320-CX01", "AE 2320-CD01"],
        ["AE 2320-CL06", "AE 2320-CX01", "AE 2320-CD01"],
      ],
    }, {
      code: "AE 2410", subject: "AE", title: "Aerospace Seminar", credits: 3,
      level: "Undergraduate", description: "",
      sections: [900, 960].map((start, index) => ({
        ...section(`S0${index + 1}`, "seminar", start, ["Seminar Tutor"]), id: `AE 2410-S0${index + 1}`,
      })),
      options: [["AE 2410-S01"], ["AE 2410-S02"]],
    }],
  };
}
