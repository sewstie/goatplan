import { describe, expect, it } from "vitest";
import { shareSummary } from "./summary";

const preferences = { startsAfter: 540, onlyOpen: true, blocked: [{}, {}] };

describe("shareSummary", () => {
  it("names locks by their section code", () => {
    const summary = shareSummary({ courses: ["AE 2320", "AE 2410"], locks: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] }, professorByCourse: {}, preferences });
    expect(summary).toEqual({
      courses: "2 courses · selected sections included",
      sections: "CL01 · CX02 locked",
      professors: "Any professor",
      preferences: "9 AM start · only open",
      blocked: "2 blocks · names hidden",
    });
  });

  it("lists chosen professors once and says when nothing is set", () => {
    const summary = shareSummary({ courses: ["AE 2320"], locks: {}, professorByCourse: { "AE 2320": "Ye Lu" }, preferences: { startsAfter: 0, onlyOpen: false, blocked: [] } });
    expect(summary).toMatchObject({ courses: "1 course · selected sections included", sections: "None locked", professors: "Ye Lu", preferences: "Any start · full sections too", blocked: "None" });
  });
});
