import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { getPlannerStore } from "@/lib/store";
import { ScheduleView } from "./ScheduleView";
import { resetPlanner, setPlanner, solved, term } from "./testing/plannerFixtures";

afterEach(resetPlanner);

function renderInCard() {
  return render(
    <section aria-label="Weekly schedule" style={{ overflow: "hidden" }}>
      <ScheduleView />
    </section>,
  );
}

describe("ScheduleView", () => {
  it("keeps the full answer's range while paging and ignores the starts-after band", () => {
    const data = structuredClone(term);
    data.courses[0].sections.find((section) => section.code === "CX02")!.meetings[0].end = 1200;
    setPlanner({ term: data, response: solved(["CX01", "CX02"]) });
    renderInCard();
    expect(screen.getByText("Auto-fit · 8:00 AM–8:00 PM")).toBeInTheDocument();
    act(() => getPlannerStore().setState({ scheduleIndex: 1 }));
    expect(screen.getByText("Auto-fit · 8:00 AM–8:00 PM")).toBeInTheDocument();
    act(() => getPlannerStore().setState({ preferences: { startsAfter: 60, blocked: [], onlyOpen: true } }));
    expect(screen.getByText("Auto-fit · 8:00 AM–8:00 PM")).toBeInTheDocument();
    act(() => getPlannerStore().setState({ response: solved(["CX01"]), scheduleIndex: 0 }));
    expect(screen.getByText("Auto-fit · 8:00 AM–5:00 PM")).toBeInTheDocument();
  });

  it("draws evening blocked times on an empty plan", () => {
    setPlanner({ courses: [], response: null, preferences: { startsAfter: 540, blocked: [{ day: "Sat", start: 1080, end: 1200 }], onlyOpen: true } });
    renderInCard();
    expect(screen.getByText("Auto-fit · 8:00 AM–8:00 PM")).toBeInTheDocument();
    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Saturday" })).toHaveTextContent("6 PM–8 PM");
  });

  it("draws one labelled block per meeting, by day", () => {
    setPlanner({ locks: { "AE 2320": ["AE 2320-CX01"] } });
    renderInCard();
    const thursday = screen.getByRole("group", { name: "Thursday" });
    expect(within(thursday).getAllByRole("button").map((block) => block.getAttribute("aria-label"))).toEqual([
      "AE 2320 CL01, Introduction to Orbital Mechanics, Thursday, 9:00 AM–9:50 AM, Unity Hall 400, Ye Lu",
      "AE 2410 C01, Introduction to Aerospace Structures, Thursday, 10:00 AM–10:50 AM, Higgins Labs 116, Mark Richman",
      "AE 2320 CX01, Introduction to Orbital Mechanics, Thursday, 2:00 PM–2:50 PM, Higgins Labs 230 Geom Modeling Computer Lab, locked",
    ]);
    expect(screen.getByText("No classes before 9:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Auto-fit · 8:00 AM–5:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Monday–Friday")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Tuesday" })).getByText("2 PM–4 PM")).toBeInTheDocument();
  });

  it("selects a section's blocks and keeps them selected when opening its calendar choices", async () => {
    setPlanner();
    const user = userEvent.setup();
    renderInCard();
    const lab = screen.getByRole("button", { name: /^AE 2320 CX01/ });
    expect(lab).toHaveAttribute("aria-pressed", "false");
    await user.click(lab);
    expect(lab).toHaveAttribute("aria-pressed", "true");
    expect(getPlannerStore().getState()).toMatchObject({ selectedCourse: "AE 2320", selectedSection: "AE 2320-CX01" });
    expect(screen.getByRole("button", { name: /^AE 2320 CL01, .*Monday/ })).toHaveAttribute("aria-pressed", "false");
    await user.click(lab);
    expect(lab).toHaveAttribute("aria-pressed", "true");
    expect(getPlannerStore().getState().selectedCourse).toBe("AE 2320");

    await user.click(screen.getByRole("button", { name: /^AE 2410 C01, .*Monday/ }));
    expect(getPlannerStore().getState()).toMatchObject({ selectedCourse: "AE 2410", selectedSection: "AE 2410-C01" });
  });

  it("names blocked times, and shows short room names with the full name in the accessible label", () => {
    setPlanner({
      preferences: { startsAfter: 540, blocked: [{ day: "Tue", start: 840, end: 960, label: "Work" }], onlyOpen: true },
    });
    renderInCard();
    const tuesday = within(screen.getByRole("group", { name: "Tuesday" }));
    expect(tuesday.getByText("Work")).toBeInTheDocument();
    expect(tuesday.getByText("2:00 PM–4:00 PM")).toBeInTheDocument();
    expect(tuesday.getByText("blocked")).toBeInTheDocument();

    const lab = screen.getByRole("button", { name: /^AE 2320 CX01/ });
    expect(lab).toHaveTextContent("Higgins Labs 230");
    expect(lab).not.toHaveTextContent("Computer Lab");
    expect(lab).toHaveAccessibleName(/Higgins Labs 230 Geom Modeling Computer Lab/);
  });

  it("lists sections with no set time under the grid", () => {
    setPlanner({ courses: ["AE 2320", "AE 2410", "AE 5131"], response: solved(["CX02"], {}, true) });
    renderInCard();
    const strip = screen.getByRole("region", { name: "No set time" });
    expect(within(strip).getByText("AE 5131 · C01")).toBeInTheDocument();
    expect(within(strip).getByText("Incompressible Fluid Dynamics · Online, asynchronous")).toBeInTheDocument();
  });

  it("shows the first-visit message, the loading placeholders and the load error", async () => {
    setPlanner({ courses: [], response: null, preferences: { startsAfter: 540, blocked: [], onlyOpen: true } });
    const { unmount } = renderInCard();
    expect(screen.getByRole("heading", { name: "Add your first course" })).toBeInTheDocument();
    expect(screen.getByText("No timed courses yet")).toBeInTheDocument();
    unmount();

    setPlanner({ termStatus: "loading", term: null, response: null });
    const loading = renderInCard();
    expect(screen.getByText("Awaiting term data")).toBeInTheDocument();
    loading.unmount();

    setPlanner({ termStatus: "error", term: null, response: null });
    renderInCard();
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load C Term sections.");
    expect(screen.getByRole("heading", { name: "Couldn’t load C Term sections." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
