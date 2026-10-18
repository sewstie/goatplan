import type { Course, Day, Meeting, Section } from "@/lib/data/types";

// Small, hand-made courses for the search and fit tests. Times are minutes after midnight.

const MON_FRI: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function meeting(days: Day[], start: number, end: number, location = "Unity Hall 400"): Meeting {
  return { days, start, end, location };
}

export function section(
  courseCode: string,
  code: string,
  changes: Partial<Section> = {},
): Section {
  return {
    id: `${courseCode}-${code}`,
    code,
    type: "lecture",
    status: "open",
    enrolled: 10,
    capacity: 40,
    waitlist: { taken: 0, capacity: 0 },
    instructors: [],
    delivery: "in-person",
    meetings: [],
    ...changes,
  };
}

export function course(code: string, title: string, sections: Section[], changes: Partial<Course> = {}): Course {
  return {
    code,
    subject: code.split(" ")[0],
    title,
    credits: 3,
    level: "Undergraduate",
    description: "",
    sections,
    options: sections.filter((item) => item.type === "lecture").map((item) => [item.id]),
    ...changes,
  };
}

/** AE 2320 as in the design: one lecture Mon–Fri 9:00 and three Thursday labs. */
export const ae2320 = course(
  "AE 2320",
  "Introduction to Orbital Mechanics",
  [
    section("AE 2320", "CL01", { instructors: ["Ye Lu"], enrolled: 84, capacity: 120, meetings: [meeting(MON_FRI, 540, 590)] }),
    section("AE 2320", "CX01", { type: "lab", instructors: ["Ye Lu"], meetings: [meeting(["Thu"], 840, 890, "Higgins Labs 230")] }),
    section("AE 2320", "CX02", { type: "lab", instructors: ["Ye Lu"], enrolled: 36, meetings: [meeting(["Thu"], 900, 950, "Higgins Labs 230")] }),
    section("AE 2320", "CX03", { type: "lab", instructors: ["Ye Lu"], meetings: [meeting(["Thu"], 960, 1010, "Higgins Labs 230")] }),
  ],
  {
    options: [
      ["AE 2320-CL01", "AE 2320-CX01"],
      ["AE 2320-CL01", "AE 2320-CX02"],
      ["AE 2320-CL01", "AE 2320-CX03"],
    ],
  },
);

export const ae2210 = course("AE 2210", "Introduction to Thermal Engineering", [
  section("AE 2210", "C01", { instructors: ["David Olinger"], meetings: [meeting(MON_FRI, 660, 710, "Salisbury Labs 104")] }),
]);

/** Meets at the same time as AE 2320's lecture. */
export const ab1533 = course("AB 1533", "Elementary Arabic III", [
  section("AB 1533", "C01", {
    instructors: ["Mohammed El Hamzaoui"],
    enrolled: 1,
    capacity: 18,
    meetings: [meeting(["Mon", "Tue", "Thu", "Fri"], 540, 590, "Olin Hall 126")],
  }),
]);

/** Every section is full. */
export const ae2410 = course("AE 2410", "Introduction to Aerospace Structures", [
  section("AE 2410", "C01", {
    instructors: ["Mark Richman"],
    status: "closed",
    enrolled: 40,
    meetings: [meeting(MON_FRI, 600, 650, "Higgins Labs 116")],
  }),
]);

export const cs2102 = course("CS 2102", "Object-Oriented Design Concepts", [
  section("CS 2102", "BL01", { instructors: ["Yu-Shan Sun"], meetings: [meeting(["Mon", "Tue", "Thu", "Fri"], 720, 770)] }),
]);

export const cs2103 = course("CS 2103", "Accelerated Object-Oriented Design Concepts", [
  section("CS 2103", "BL01", { instructors: ["Gary Pollice"], meetings: [meeting(["Mon", "Tue", "Thu", "Fri"], 780, 830)] }),
]);

export const cs502 = course(
  "CS 502",
  "Operating Systems",
  [section("CS 502", "S01", { instructors: ["Craig Shue"], meetings: [meeting(["Tue"], 1080, 1230)] })],
  { level: "Graduate" },
);

export const cs3013 = course("CS 3013", "Operating Systems", [
  section("CS 3013", "BL01", { instructors: ["Craig Shue"], meetings: [meeting(["Mon", "Tue", "Thu", "Fri"], 600, 650)] }),
]);

/** A topic course whose section has its own title. */
export const hu3900 = course(
  "HU 3900",
  "Inquiry Seminar in Humanities and Arts",
  [section("HU 3900", "B01", { type: "seminar", title: "INQ SEM: Early American History", instructors: ["José Peña"] })],
  { options: [["HU 3900-B01"]] },
);

export const allCourses = [ab1533, ae2210, ae2320, ae2410, cs2102, cs2103, cs3013, cs502, hu3900];
