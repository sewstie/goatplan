import type { Course, Section } from "@/lib/data/types";

// Hand-made sections shaped like the C Term 2027 examples in the designs.

export function makeSection(id: string, changes: Partial<Section> = {}): Section {
  const [, code] = id.split("-");
  return {
    id,
    code,
    type: "lecture",
    status: "open",
    enrolled: 84,
    capacity: 120,
    waitlist: { taken: 0, capacity: 0 },
    instructors: ["Ye Lu"],
    delivery: "in-person",
    meetings: [{ days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start: 540, end: 590, location: "Unity Hall 400" }],
    ...changes,
  };
}

const lab = (code: string, start: number, location = "Higgins Labs 230"): Section =>
  makeSection(`AE 2320-${code}`, {
    type: "lab",
    enrolled: 36,
    capacity: 40,
    meetings: [{ days: ["Thu"], start, end: start + 50, location }],
  });

/** AE 2320 with one lecture and three labs; CX02 and CX04 meet at the same time. */
export const orbitalMechanics: Course = {
  code: "AE 2320",
  subject: "AE",
  title: "Introduction to Orbital Mechanics",
  credits: 1,
  level: "Undergraduate",
  description: "",
  sections: [
    makeSection("AE 2320-CL01"),
    lab("CX01", 840),
    lab("CX02", 900),
    { ...lab("CX04", 900, "Higgins Labs 231"), enrolled: 20, instructors: [] },
  ],
  options: [
    ["AE 2320-CL01", "AE 2320-CX01"],
    ["AE 2320-CL01", "AE 2320-CX02"],
    ["AE 2320-CL01", "AE 2320-CX04"],
  ],
};
