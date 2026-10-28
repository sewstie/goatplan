import { expect, it } from "vitest";
import { makeSection } from "@/components/sections/testing/sections";
import { openSeatsShort, otherChoicesLabel } from "./phoneSectionText";

it("counts open seats in the short form", () => {
  expect(openSeatsShort({ enrolled: 28, capacity: 40 })).toBe("12 seats open");
  expect(openSeatsShort({ enrolled: 39, capacity: 40 })).toBe("1 seat open");
  expect(openSeatsShort({ enrolled: 40, capacity: 40 })).toBe("Full");
});

it("says professors when each other lecture brings a different professor", () => {
  const current = makeSection("DEMO 3001-L01", { instructors: ["Alex Rivera"] });
  const others = [makeSection("DEMO 3001-L02", { instructors: ["Jordan Kim"] }), makeSection("DEMO 3001-L03", { instructors: ["Morgan Lee"] })];
  expect(otherChoicesLabel(current, others)).toBe("2 other professors");
  expect(otherChoicesLabel(current, others.slice(0, 1))).toBe("1 other professor");
});

it("says times when a professor repeats, a lecture is co-taught or the section is a lab", () => {
  const current = makeSection("AE 2320-CL01", { instructors: ["Ye Lu"] });
  expect(otherChoicesLabel(current, [makeSection("AE 2320-CL02", { instructors: ["Ye Lu"] })])).toBe("1 other time");
  expect(otherChoicesLabel(current, [makeSection("AE 2320-CL02", { instructors: ["Jordan Kim"] }), makeSection("AE 2320-CL03", { instructors: ["Jordan Kim"] })])).toBe("2 other times");
  expect(otherChoicesLabel(current, [makeSection("AE 2320-CL02", { instructors: ["Jordan Kim", "Morgan Lee"] })])).toBe("1 other time");
  const lab = makeSection("AE 2320-CX02", { type: "lab", instructors: ["Ye Lu"] });
  expect(otherChoicesLabel(lab, [makeSection("AE 2320-CX01", { type: "lab", instructors: ["Sam Patel"] })])).toBe("1 other time");
});
