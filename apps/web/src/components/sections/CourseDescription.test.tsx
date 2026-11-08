import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { termFile } from "@/lib/store/testing/fixtures";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { polyfillDialog, startTestPlanner } from "./testing/plannerStore";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("./testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

function describedTerm(description: string) {
  const term = termFile("2027-C");
  term.courses[0].description = description;
  return term;
}

describe("Course description", () => {
  it("opens in the panel and goes back to the sections", async () => {
    const user = userEvent.setup();
    await startTestPlanner({ courses: ["AE 2320"] }, { term: describedTerm("Cat. I Orbits and rockets. Recommended background: MA 2051.") });
    render(<CourseDetailsPanel />);

    await user.click(screen.getByRole("button", { name: "Course description" }));

    expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toHaveFocus();
    expect(screen.getByText("Offered every year")).toBeInTheDocument();
    expect(screen.getByText("Orbits and rockets.")).toBeInTheDocument();
    expect(screen.getByText("Recommended background:")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Sections in this schedule" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to sections" }));

    expect(screen.getByRole("button", { name: "Course description" })).toHaveFocus();
    expect(screen.queryByText("Orbits and rockets.")).not.toBeInTheDocument();
  });

  it("says so when WPI has no description", async () => {
    const user = userEvent.setup();
    await startTestPlanner({ courses: ["AE 2320"] }, { term: describedTerm("") });
    render(<CourseDetailsPanel />);

    await user.click(screen.getByRole("button", { name: "Course description" }));

    expect(screen.getByText("WPI has no description for this course.")).toBeInTheDocument();
  });

  it("goes back to the sections after a click on another block of the course", async () => {
    const user = userEvent.setup();
    const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term: describedTerm("Orbits.") });
    render(<CourseDetailsPanel />);

    await user.click(screen.getByRole("button", { name: "Course description" }));
    act(() => store.getState().selectCourse("AE 2320", "AE 2320-CX01"));

    expect(screen.queryByText("Orbits.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Course description" })).toBeInTheDocument();
  });
});
