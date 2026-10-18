import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ScheduleBanner } from "./ScheduleBanner";
import { ScheduleSummary } from "./ScheduleSummary";
import { resetPlanner, setPlanner, solved } from "./testing/plannerFixtures";

afterEach(resetPlanner);

describe("ScheduleSummary", () => {
  it("counts courses and schedules, then describes the shown schedule in chips", () => {
    setPlanner();
    render(<ScheduleSummary />);
    expect(screen.getByText("2 courses · 3 schedules fit")).toBeInTheDocument();
    const chips = screen.getByRole("list", { name: "This schedule" });
    expect(chips).toHaveTextContent("5 days on campus");
    expect(chips).toHaveTextContent("1 h between classes");
    expect(chips).toHaveTextContent("4 h 10 min of early classes");
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
