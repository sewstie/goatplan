import { describe, expect, it } from "vitest";
import { backgroundTag, offeringTag } from "./suggestionTags";

describe("suggestion tags", () => {
  it("marks ready background and confirmed offerings as good", () => {
    expect(backgroundTag("completed")).toEqual(["Background met", "good"]);
    expect(offeringTag("confirmed")).toEqual(["Offered", "good"]);
  });

  it("flags anything the student still has to check", () => {
    expect(backgroundTag("skills")[1]).toBe("warn");
    expect(backgroundTag("missing")[1]).toBe("warn");
    expect(offeringTag("absent")[1]).toBe("warn");
    expect(offeringTag("failed")[1]).toBe("warn");
    expect(offeringTag("estimated")).toEqual(["Usually offered", "plain"]);
  });
});
