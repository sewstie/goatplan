import { describe, expect, it } from "vitest";
import type { Section } from "@/lib/data/types";
import { describeCourse, describeText } from "./descriptionText";

function section(code: string, extra: Partial<Section> = {}): Section {
  return {
    id: `HU 3900-${code}`,
    code,
    type: "lecture",
    status: "open",
    enrolled: 0,
    capacity: 10,
    waitlist: { taken: 0, capacity: 0 },
    instructors: [],
    delivery: "in-person",
    meetings: [],
    ...extra,
  };
}

describe("describeText", () => {
  it("turns WPI's category into plain words", () => {
    expect(describeText("Cat. I This course covers orbits.")).toEqual({ offered: "Offered every year", parts: [{ text: "This course covers orbits." }] });
    expect(describeText("Cat. II. This course covers orbits.").offered).toBe("Offered at least every other year");
    expect(describeText("Cat.III This course covers orbits.").offered).toBe("Offered only when enough students need it");
    expect(describeText("Cat. I, Units 1/3. This course covers orbits.").parts).toEqual([{ text: "Units 1/3. This course covers orbits." }]);
  });

  it("leaves text alone when the category isn't at the start", () => {
    const text = "AR 1400 Digital Photography (1/3 units; Cat. II) This course teaches photography.";
    expect(describeText(text)).toEqual({ offered: null, parts: [{ text }] });
    expect(describeText("Cat.IT is not a category.").offered).toBeNull();
  });

  it("puts background and credit notes in their own paragraphs", () => {
    const text = "Cat. I Fluid flows. Recommended background: MA 2051. Students may not receive credit for both AE 2110 and AE 3602.";
    expect(describeText(text).parts).toEqual([
      { text: "Fluid flows." },
      { label: "Recommended background", text: "MA 2051." },
      { text: "Students may not receive credit for both AE 2110 and AE 3602." },
    ]);
  });

  it("has no paragraphs when WPI gives no description", () => {
    expect(describeText("")).toEqual({ offered: null, parts: [] });
  });
});

describe("describeCourse", () => {
  it("adds each section topic once", () => {
    const sections = [
      section("CL01", { title: "INQ SEM: Early American History", description: "Colonial life." }),
      section("CD01", { type: "discussion", description: "Colonial life." }),
      section("CL02"),
    ];
    expect(describeCourse({ description: "Cat. I Inquiry seminar." }, sections)).toEqual({
      offered: "Offered every year",
      parts: [{ text: "Inquiry seminar." }],
      topics: [{ section: "CL01", title: "INQ SEM: Early American History", offered: null, parts: [{ text: "Colonial life." }] }],
    });
  });
});
