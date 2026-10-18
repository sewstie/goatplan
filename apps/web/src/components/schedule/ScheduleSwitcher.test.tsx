import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { getPlannerStore } from "@/lib/store";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { resetPlanner, setPlanner, solved } from "./testing/plannerFixtures";

afterEach(resetPlanner);

const index = () => getPlannerStore().getState().scheduleIndex;

describe("ScheduleSwitcher", () => {
  it("pages through schedules with the arrows and the arrow keys", async () => {
    setPlanner();
    const user = userEvent.setup();
    render(<ScheduleSwitcher />);
    expect(screen.getByText("Schedule 1 of 3")).toBeInTheDocument();

    const previous = screen.getByRole("button", { name: "Previous schedule" });
    const next = screen.getByRole("button", { name: "Next schedule" });
    expect(previous).toHaveAttribute("aria-disabled", "true");

    await user.click(next);
    expect(screen.getByText("Schedule 2 of 3")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(index()).toBe(2);
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(index()).toBe(2);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(index()).toBe(0);
  });

  it("follows the arrow keys when nothing is focused", async () => {
    setPlanner();
    const user = userEvent.setup();
    render(<ScheduleSwitcher />);
    await user.keyboard("{ArrowRight}");
    expect(index()).toBe(1);
  });

  it("leaves the keys alone while typing", async () => {
    setPlanner();
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Search" />
        <ScheduleSwitcher />
      </>,
    );
    await user.click(screen.getByRole("textbox", { name: "Search" }));
    await user.keyboard("{ArrowRight}");
    expect(index()).toBe(0);
  });

  it("hides the arrows when one schedule fits", () => {
    setPlanner({ response: solved(["CX02"]) });
    render(<ScheduleSwitcher />);
    expect(screen.getByText("Schedule 1 of 1")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("warns when nothing fits", () => {
    setPlanner({ response: solved([], { total: 0, patterns: 0 }) });
    render(<ScheduleSwitcher />);
    expect(screen.getByText("0 schedules fit")).toBeInTheDocument();
  });

  it("holds the place with a skeleton while the term loads, and shows nothing without courses", () => {
    setPlanner({ termStatus: "loading", term: null, response: null });
    const { container, rerender } = render(<ScheduleSwitcher />);
    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument();

    act(() => setPlanner({ courses: [], response: null, solveStatus: "idle" }));
    rerender(<ScheduleSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });
});
