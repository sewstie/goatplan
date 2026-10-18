import { describe, expect, it } from "vitest";
import { sortOptions } from "./sortOptions";

describe("sortOptions", () => {
  it("shows only the sort order in the design", () => {
    expect(sortOptions("fewestEarly")).toEqual([{ value: "fewestEarly", label: "Fewest early classes" }]);
  });

  it("still shows a hidden order when a draft already uses it", () => {
    expect(sortOptions("fewestDays").map((option) => option.value)).toEqual(["fewestEarly", "fewestDays"]);
  });
});
