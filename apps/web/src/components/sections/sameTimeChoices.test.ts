import { describe, expect, it } from "vitest";
import { sameTimeChoices } from "./sameTimeChoices";
import { makeSection, orbitalMechanics } from "./testing/sections";

const cx02 = ["AE 2320-CL01", "AE 2320-CX02"];
const cx04 = ["AE 2320-CL01", "AE 2320-CX04"];

describe("sameTimeChoices", () => {
  it("lists the other same-time labs with their seats", () => {
    const result = sameTimeChoices(orbitalMechanics, [cx02, cx04], cx02)!;
    expect(result.kind).toBe("lab");
    expect(result.times).toEqual(["Thu · 3:00 PM–3:50 PM"]);
    expect(result.current).toMatchObject({ label: "CX02", openSeats: 4, sectionIds: cx02 });
    expect(result.others).toEqual([
      expect.objectContaining({ label: "CX04", detail: "Higgins Labs 231", openSeats: 20, sectionIds: cx04 }),
    ]);
    expect(result.suggested.label).toBe("CX04");
  });

  it("shows the room and the instructor", () => {
    const result = sameTimeChoices(orbitalMechanics, [cx02, cx04], cx04)!;
    expect(result.others[0].detail).toBe("Higgins Labs 230 · Ye Lu");
  });

  it("finds the current choice whatever the order of its ids", () => {
    expect(sameTimeChoices(orbitalMechanics, [cx02, cx04], [...cx02].reverse())?.current.label).toBe("CX02");
  });

  it("suggests the choice with the most open seats", () => {
    const course = {
      ...orbitalMechanics,
      sections: [
        ...orbitalMechanics.sections,
        makeSection("AE 2320-CX05", { type: "lab", enrolled: 39, capacity: 40 }),
        makeSection("AE 2320-CX10", { type: "lab", enrolled: 10, capacity: 40 }),
      ],
    };
    const options = [cx02, ["AE 2320-CL01", "AE 2320-CX10"], ["AE 2320-CL01", "AE 2320-CX05"], cx04];
    const result = sameTimeChoices(course, options, cx02)!;
    expect(result.others.map((choice) => choice.label)).toEqual(["CX04", "CX05", "CX10"]);
    expect(result.suggested.label).toBe("CX10");
  });

  it("says 'section' when more than one kind of section changes", () => {
    const course = {
      ...orbitalMechanics,
      sections: [...orbitalMechanics.sections, makeSection("AE 2320-CL02")],
    };
    const result = sameTimeChoices(course, [cx02, ["AE 2320-CL02", "AE 2320-CX04"]], cx02)!;
    expect(result.kind).toBe("section");
    expect(result.others[0].label).toBe("CL02 · CX04");
  });

  it("is null when there is nothing else to pick", () => {
    expect(sameTimeChoices(orbitalMechanics, [cx02], cx02)).toBeNull();
    expect(sameTimeChoices(orbitalMechanics, [], [])).toBeNull();
  });

  it("is null when the chosen sections aren't among the alternatives", () => {
    expect(sameTimeChoices(orbitalMechanics, [cx02, cx04], ["AE 2320-CL01", "AE 2320-CX01"])).toBeNull();
  });
});
