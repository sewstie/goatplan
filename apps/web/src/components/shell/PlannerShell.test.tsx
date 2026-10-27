import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { getPlannerStore } from "@/lib/store";

// A phone flag we can flip per test without a real matchMedia.
let phoneFlag = false;
vi.mock("@/components/shell/usePhoneViewport", () => ({
  usePhoneViewport: () => phoneFlag,
}));

// The term picker and detail/search panels pull in the whole data + engine stack; the shell test only
// cares about the Toast wiring, so stub them with light stand-ins. The sidebar/disclosure stubs expose
// a course row so the focus-after-undo path has a real [data-course-row] target to land on.
vi.mock("@/components/courses/TermPicker", () => ({ TermPicker: () => <div data-testid="term-picker" /> }));
vi.mock("@/components/courses/CourseSearchPanel", () => ({
  CourseSearchPanel: () => (
    <ul>
      <li>
        <button type="button" data-course-row="AE 2320">
          AE 2320
        </button>
      </li>
    </ul>
  ),
}));
vi.mock("@/components/sections/CourseDetailsPanel", () => ({ CourseDetailsPanel: () => <div data-testid="details" /> }));
vi.mock("@/components/sections/ChooseAlternativeSheet", () => ({ ChooseAlternativeSheet: () => null }));

// Import after the mocks are registered so PlannerShell picks up the stubs.
import { PlannerShell } from "./PlannerShell";

const removed = {
  code: "AE 2320",
  index: 0,
  locks: undefined,
  professor: undefined,
  alternatives: {},
  wasSelected: true,
};

function renderShell() {
  return render(
    <PlannerShell
      header={<header>header</header>}
      toolbar={<div>toolbar</div>}
      banner={<div>banner</div>}
      schedule={<div>schedule</div>}
    />,
  );
}

beforeEach(() => {
  phoneFlag = false;
});

afterEach(() => {
  resetPlanner();
  vi.useRealTimers();
});

describe("PlannerShell toast wiring", () => {
  it("shows the toast with the removed course code when one is pending", () => {
    setPlanner({ courses: ["AE 2410"], removedCourse: removed });
    renderShell();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Removed AE 2320");
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("shows no message when nothing has been removed", () => {
    setPlanner({ courses: ["AE 2320", "AE 2410"], removedCourse: null });
    renderShell();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("restores the course and clears the toast when Undo is clicked", async () => {
    const user = userEvent.setup();
    // Start with the course already removed from the list and a pending removedCourse snapshot.
    setPlanner({ courses: ["AE 2410"], removedCourse: removed });
    renderShell();
    await user.click(screen.getByRole("button", { name: "Undo" }));

    const state = getPlannerStore().getState();
    expect(state.courses).toContain("AE 2320");
    expect(state.removedCourse).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("dismisses the removed course when the toast times out", () => {
    vi.useFakeTimers();
    setPlanner({ courses: ["AE 2410"], removedCourse: removed });
    renderShell();
    expect(getPlannerStore().getState().removedCourse).not.toBeNull();

    act(() => vi.advanceTimersByTime(6000));
    expect(getPlannerStore().getState().removedCourse).toBeNull();
  });

  it("moves focus to the restored course row after undo", async () => {
    const user = userEvent.setup();
    setPlanner({ courses: ["AE 2410"], removedCourse: removed });
    renderShell();
    await user.click(screen.getByRole("button", { name: "Undo" }));

    const row = document.querySelector<HTMLElement>('[data-course-row="AE 2320"]');
    expect(row).not.toBeNull();
    expect(row).toHaveFocus();
  });

  it("opens the collapsed disclosure first on a phone before focusing the row", async () => {
    phoneFlag = true;
    const user = userEvent.setup();
    // One course already planned, so the phone disclosure renders collapsed.
    setPlanner({ courses: ["AE 2410"], removedCourse: removed });
    renderShell();

    const disclosure = document.querySelector<HTMLButtonElement>("[data-your-courses-disclosure]");
    expect(disclosure).not.toBeNull();
    expect(disclosure).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(disclosure).toHaveAttribute("aria-expanded", "true");

    // The row lives inside the now-open disclosure; focus lands on it after the next frame.
    await vi.waitFor(() => {
      const row = document.querySelector<HTMLElement>('[data-course-row="AE 2320"]');
      expect(row).toHaveFocus();
    });
  });
});
