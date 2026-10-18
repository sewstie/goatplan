import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ScheduleView } from "./ScheduleView";
import { resetPlanner, setPlanner, solved } from "./testing/plannerFixtures";

afterEach(resetPlanner);

function renderInCard() {
  return render(
    <section aria-label="Weekly schedule" style={{ overflow: "hidden" }}>
      <ScheduleView />
    </section>,
  );
}

describe("ScheduleView", () => {
  it("draws one labelled block per meeting, by day", () => {
    setPlanner({ locks: { "AE 2320": ["AE 2320-CX01"] } });
    renderInCard();
    const thursday = screen.getByRole("group", { name: "Thursday" });
    expect(within(thursday).getAllByRole("button").map((block) => block.getAttribute("aria-label"))).toEqual([
      "AE 2320 CL01, Introduction to Orbital Mechanics, Thursday, 9:00 AM–9:50 AM, Unity Hall 400, Ye Lu",
      "AE 2410 C01, Introduction to Aerospace Structures, Thursday, 10:00 AM–10:50 AM, Higgins Labs 116, Mark Richman",
      "AE 2320 CX01, Introduction to Orbital Mechanics, Thursday, 2:00 PM–2:50 PM, Higgins Labs 230, Ye Lu, locked",
    ]);
    expect(screen.getByText("No classes before 9:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Auto-fit · 8:30 AM–4:30 PM")).toBeInTheDocument();
    expect(screen.getByText("Monday–Friday")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Tuesday" })).getByText("Blocked time")).toBeInTheDocument();
  });

  it("shows details in a tooltip outside the clipped card on hover and focus, and Escape closes it", async () => {
    setPlanner();
    const user = userEvent.setup();
    const { container } = renderInCard();
    const block = screen.getByRole("button", { name: /^AE 2410 C01, .*Tuesday/ });

    await user.hover(block);
    const tooltip = document.querySelector("[data-calendar-tooltip]");
    expect(tooltip).toHaveTextContent("AE 2410 · C01");
    expect(tooltip).toHaveTextContent("Introduction to Aerospace Structures");
    expect(tooltip).toHaveTextContent("Tue · 10:00–10:50 AM");
    expect(tooltip).toHaveTextContent("Higgins Labs 116 · Mark Richman");
    expect(container.contains(tooltip)).toBe(false);

    await user.unhover(block);
    expect(document.querySelector("[data-calendar-tooltip]")).toBeNull();

    act(() => block.focus());
    expect(document.querySelector("[data-calendar-tooltip]")).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(document.querySelector("[data-calendar-tooltip]")).toBeNull();
  });

  it("selects a section's blocks on click, and a second click clears it", async () => {
    setPlanner();
    const user = userEvent.setup();
    renderInCard();
    const lab = screen.getByRole("button", { name: /^AE 2320 CX01/ });
    expect(lab).toHaveAttribute("aria-pressed", "false");
    await user.click(lab);
    expect(lab).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^AE 2320 CL01, .*Monday/ })).toHaveAttribute("aria-pressed", "false");
    await user.click(lab);
    expect(lab).toHaveAttribute("aria-pressed", "false");
  });

  it("lists sections with no set time under the grid", () => {
    setPlanner({ courses: ["AE 2320", "AE 2410", "AE 5131"], response: solved(["CX02"], {}, true) });
    renderInCard();
    const strip = screen.getByRole("region", { name: "No set time" });
    expect(within(strip).getByText("AE 5131 · C01")).toBeInTheDocument();
    expect(within(strip).getByText("Incompressible Fluid Dynamics · Online, asynchronous")).toBeInTheDocument();
  });

  it("shows the first-visit message, the loading placeholders and the load error", async () => {
    setPlanner({ courses: [], response: null });
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
