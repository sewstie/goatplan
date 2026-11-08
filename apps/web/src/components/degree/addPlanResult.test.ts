import { describe, expect, it } from "vitest";
import { addPlanMessage } from "./addPlanResult";

describe("addPlanMessage", () => {
  it("counts the added courses and names the term", () => {
    expect(addPlanMessage({ status: "added", added: 3 }, 3, "C Term 2027")).toEqual({ tone: "success", title: "3 courses added", detail: "Planned for C Term 2027." });
  });

  it("says how many were already there", () => {
    expect(addPlanMessage({ status: "added", added: 1 }, 3, "C Term 2027")).toEqual({ tone: "success", title: "1 course added", detail: "Planned for C Term 2027. 2 courses already there." });
  });

  it("says when nothing changed", () => {
    expect(addPlanMessage({ status: "added", added: 0 }, 2, "C Term 2027").title).toBe("Already in My degree");
    expect(addPlanMessage({ status: "added", added: 0 }, 1, "C Term 2027").detail).toBe("This course was already there.");
  });

  it("warns when the courses can't be kept", () => {
    expect(addPlanMessage({ status: "unsaved", added: 0 }, 2, "C Term 2027")).toMatchObject({ tone: "warning", title: "Added for this visit only" });
    expect(addPlanMessage({ status: "invalid", added: 0 }, 2, "C Term 2027")).toMatchObject({ tone: "warning", title: "Couldn’t add these courses" });
  });
});
