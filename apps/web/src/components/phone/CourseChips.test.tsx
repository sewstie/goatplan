import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { getPlannerStore } from "@/lib/store";
import { CourseChips } from "./CourseChips";
import { usePhoneScreen } from "./phoneScreen";

afterEach(() => {
  resetPlanner();
  usePhoneScreen.setState({ screen: "schedule" });
});

describe("CourseChips", () => {
  it("shows one chip per planned course and marks locked ones", () => {
    setPlanner({ locks: { "AE 2320": ["AE 2320-CX02"] } });
    render(<CourseChips />);

    expect(screen.getByRole("button", { name: "AE 2320, has locked sections. Show details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AE 2410. Show details" })).toBeInTheDocument();
  });

  it("picks the course and opens its details screen on tap", async () => {
    setPlanner();
    render(<CourseChips />);

    await userEvent.click(screen.getByRole("button", { name: "AE 2410. Show details" }));
    expect(getPlannerStore().getState().selectedCourse).toBe("AE 2410");
    expect(usePhoneScreen.getState().screen).toBe("course");
  });

  it("renders nothing with no courses", () => {
    setPlanner({ courses: [] });
    const { container } = render(<CourseChips />);
    expect(container).toBeEmptyDOMElement();
  });
});
