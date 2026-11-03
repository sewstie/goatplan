import type { SharedPlan } from "./codec";

export const plan: SharedPlan = {
  termId: "2027-C",
  courses: ["AE 2320", "AE 2410"],
  chosen: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"], "AE 2410": ["AE 2410-C01"] },
  locks: { "AE 2320": ["AE 2320-CX02"] },
  professorByCourse: { "AE 2320": "José Lu", "AE 2410": null },
  preferences: { startsAfter: 540, blocked: [{ day: "Tue", start: 600, end: 660 }], onlyOpen: false },
  sortPreset: "fewestDays",
};
