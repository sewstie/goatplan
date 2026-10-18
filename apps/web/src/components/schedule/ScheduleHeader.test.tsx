import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScheduleBanner } from "./ScheduleBanner";
import { ScheduleSummary } from "./ScheduleSummary";
import { resetPlanner, setPlanner, solved } from "./testing/plannerFixtures";
import { tooltipPosition } from "./tooltipPosition";

afterEach(resetPlanner);

describe("ScheduleSummary", () => {
  it("counts courses and schedules, then describes the shown schedule in chips", () => {
    setPlanner();
    render(<ScheduleSummary />);
    expect(screen.getByText("2 courses · 3 schedules fit")).toBeInTheDocument();
    const chips = screen.getByRole("list", { name: "This schedule" });
    expect(chips).toHaveTextContent("5 days on campus");
    expect(chips).toHaveTextContent("1 h between classes");
    expect(chips).toHaveTextContent("4 h 10 min of class before 10 AM");
  });

  it("says which term is loading", () => {
    setPlanner({ termStatus: "loading", term: null, response: null });
    render(<ScheduleSummary />);
    expect(screen.getByText("Loading C Term sections…")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("ScheduleBanner", () => {
  it("notes when only the best schedules are shown", () => {
    setPlanner({ response: solved(["CX01", "CX02"], { patterns: 3252, total: 4076 }) });
    render(<ScheduleBanner />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing the best 2 of 3,252 schedules. Lock a section or add preferences to narrow it down.",
    );
  });

  it("stays empty for a normal answer and while the term loads", () => {
    setPlanner();
    const { container, unmount } = render(<ScheduleBanner />);
    expect(container).toBeEmptyDOMElement();
    unmount();

    setPlanner({ termStatus: "loading", term: null, response: null, solveStatus: "solving" });
    expect(render(<ScheduleBanner />).container).toBeEmptyDOMElement();
  });
});

describe("tooltipPosition", () => {
  const viewport = { width: 1440, height: 900 };

  it("sits under the block, a little to its left", () => {
    expect(tooltipPosition({ left: 520, top: 318, bottom: 370 }, viewport)).toEqual({ left: 512, top: 394 });
  });

  it("goes above blocks near the bottom and stays on screen", () => {
    expect(tooltipPosition({ left: 1400, top: 800, bottom: 850 }, viewport)).toEqual({ left: 1212, bottom: 124 });
    expect(tooltipPosition({ left: 0, top: 100, bottom: 150 }, viewport).left).toBe(8);
  });
});
