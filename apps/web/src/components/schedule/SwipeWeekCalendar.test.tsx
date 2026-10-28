import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";
import { SwipeWeekCalendar } from "./SwipeWeekCalendar";

afterEach(resetPlanner);

const week = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

describe("SwipeWeekCalendar", () => {
  it("names each day column and labels hours without AM or PM", () => {
    setPlanner();
    render(<SwipeWeekCalendar days={week} range={{ start: 510, end: 990 }} note="Auto-fit to your schedule" renderDay={() => null} />);

    for (const name of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("8:30")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("4:30")).toBeInTheDocument();
    expect(screen.getByText("8:30 AM–4:30 PM")).toBeInTheDocument();
    expect(screen.getByText("Auto-fit to your schedule")).toBeInTheDocument();
    expect(screen.getByText("Mon–Fri")).toBeInTheDocument();
  });

  it("says there are no set times while the grid is empty", () => {
    setPlanner({ courses: [] });
    render(<SwipeWeekCalendar days={week} range={{ start: 480, end: 1080 }} note="Auto-fit to your schedule" />);
    expect(screen.getByText(/No set times yet/)).toBeInTheDocument();
  });

  it("scrolls sideways to the next days from the swipe link", async () => {
    setPlanner();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    render(<SwipeWeekCalendar days={week} range={{ start: 480, end: 1080 }} note="" renderDay={() => null} />);

    await userEvent.click(screen.getByRole("button", { name: "Swipe for more days" }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
  });

  it("has no swipe link when every day already fits", () => {
    setPlanner();
    render(<SwipeWeekCalendar days={["Thu"]} range={{ start: 780, end: 1020 }} note="" renderDay={() => null} />);
    expect(screen.queryByRole("button", { name: /Swipe/ })).not.toBeInTheDocument();
  });
});
