import { describe, expect, it } from "vitest";
import { groupPlansByTerm } from "./groups";
import { designPlan } from "./testing";

describe("groupPlansByTerm", () => {
  it("groups by term in date order and keeps each term's plans in order", () => {
    const plans = [
      designPlan({ id: "d1", termId: "2027-D" }),
      designPlan({ id: "c1", termId: "2027-C" }),
      designPlan({ id: "b1", termId: "2026-B" }),
      designPlan({ id: "c2", termId: "2027-C" }),
    ];
    expect(groupPlansByTerm(plans).map((group) => group.map((plan) => plan.id))).toEqual([
      ["b1"],
      ["c1", "c2"],
      ["d1"],
    ]);
  });

  it("is empty without plans", () => {
    expect(groupPlansByTerm([])).toEqual([]);
  });
});
