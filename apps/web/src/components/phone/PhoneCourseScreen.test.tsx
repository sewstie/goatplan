import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { getPlannerStore } from "@/lib/store";
import { PhoneCourseScreen } from "./PhoneCourseScreen";
import { usePhoneScreen } from "./phoneScreen";

afterEach(() => {
  resetPlanner();
  usePhoneScreen.setState({ screen: "schedule" });
});

describe("PhoneCourseScreen", () => {
  it("removes the open course and goes back to the schedule", async () => {
    setPlanner({ selectedCourse: "AE 2410" });
    usePhoneScreen.setState({ screen: "course" });
    render(<PhoneCourseScreen />);

    await userEvent.click(screen.getByRole("button", { name: "Remove AE 2410" }));
    expect(getPlannerStore().getState().courses).not.toContain("AE 2410");
    expect(getPlannerStore().getState().removedCourse?.code).toBe("AE 2410");
    expect(usePhoneScreen.getState().screen).toBe("schedule");
  });

  it("has no remove button for a saved plan", () => {
    setPlanner({ selectedCourse: "AE 2410", savedPlanId: "plan-1" });
    render(<PhoneCourseScreen />);
    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
  });
});
