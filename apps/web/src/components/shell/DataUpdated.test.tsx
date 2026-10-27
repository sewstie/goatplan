import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { DataUpdated } from "./DataUpdated";

afterEach(resetPlanner);

describe("DataUpdated", () => {
  it("shows the formatted date when a term is selected", () => {
    setPlanner();
    render(<DataUpdated />);
    expect(screen.getByText(/Course data updated/)).toHaveTextContent("Course data updated Oct 17, 2026");
  });

  it("uses a <time> element with the full ISO timestamp as datetime", () => {
    setPlanner();
    render(<DataUpdated />);
    const time = screen.getByText(/Oct 17, 2026/).closest("time");
    expect(time).toBeInTheDocument();
    expect(time).toHaveAttribute("dateTime", "2026-10-17T12:52:39Z");
  });

  it("renders nothing before the term list loads", () => {
    setPlanner({ terms: [], termId: null });
    const { container } = render(<DataUpdated />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when termId is set but term list is empty", () => {
    setPlanner({ terms: [], termId: "2027-C" });
    const { container } = render(<DataUpdated />);
    expect(container).toBeEmptyDOMElement();
  });

  it("updates when the term changes", () => {
    setPlanner({
      terms: [
        { id: "2026-B", name: "B Term", season: "Fall", year: 2026, start: "2026-10-19", end: "2026-12-11", status: "in-progress", courses: 1, sections: 1, generatedAt: "2026-09-01T10:00:00Z" },
        { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05", status: "upcoming", courses: 1, sections: 1, generatedAt: "2026-10-17T12:52:39Z" },
      ],
      termId: "2026-B",
    });
    render(<DataUpdated />);
    expect(screen.getByText(/Course data updated/)).toHaveTextContent("Course data updated Sep 1, 2026");
  });

  it("applies muted text styling", () => {
    setPlanner();
    render(<DataUpdated />);
    const el = screen.getByText(/Course data updated/);
    expect(el).toHaveClass("text-ink-muted", "text-9", "font-400");
  });
});

describe("DataUpdated with termId override (plans page)", () => {
  it("shows the date for a specific term via termId prop", () => {
    setPlanner({
      terms: [
        { id: "2026-B", name: "B Term", season: "Fall", year: 2026, start: "2026-10-19", end: "2026-12-11", status: "in-progress", courses: 1, sections: 1, generatedAt: "2026-09-01T10:00:00Z" },
        { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05", status: "upcoming", courses: 1, sections: 1, generatedAt: "2026-10-17T12:52:39Z" },
      ],
      termId: "2026-B",
    });
    render(<DataUpdated termId="2027-C" />);
    expect(screen.getByText(/Course data updated/)).toHaveTextContent("Course data updated Oct 17, 2026");
  });

  it("renders nothing when the overridden termId is not in the term list", () => {
    setPlanner();
    const { container } = render(<DataUpdated termId="9999-Z" />);
    expect(container).toBeEmptyDOMElement();
  });
});
