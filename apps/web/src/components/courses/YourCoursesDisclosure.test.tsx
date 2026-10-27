import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { YourCoursesDisclosure } from "./YourCoursesDisclosure";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";

afterEach(() => resetPlanner());

function Content() {
  return <p>panel body</p>;
}

function renderDisclosure() {
  return render(
    <YourCoursesDisclosure>
      <Content />
    </YourCoursesDisclosure>,
  );
}

describe("YourCoursesDisclosure", () => {
  it("starts open and shows the panel when there are no courses", () => {
    setPlanner({ courses: [] });
    renderDisclosure();
    const button = screen.getByRole("button", { name: "Your courses" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("panel body")).toBeVisible();
  });

  it("labels the button with the course count", () => {
    setPlanner({ courses: ["AE 2320", "AE 2410"] });
    renderDisclosure();
    expect(screen.getByRole("button", { name: "Your courses (2)" })).toBeInTheDocument();
  });

  it("starts collapsed with courses and shows a muted summary of their codes", () => {
    setPlanner({ courses: ["AE 2320", "AE 2410"] });
    renderDisclosure();
    const button = screen.getByRole("button", { name: "Your courses (2)" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("AE 2320, AE 2410")).toBeInTheDocument();
    expect(screen.queryByText("panel body")).not.toBeInTheDocument();
  });

  it("toggles open and closed on click, and the caret turns", async () => {
    const user = userEvent.setup();
    setPlanner({ courses: ["AE 2320"] });
    renderDisclosure();
    const button = screen.getByRole("button", { name: "Your courses (1)" });
    const caret = button.querySelector("svg")!;
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(caret).not.toHaveClass("rotate-180");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(caret).toHaveClass("rotate-180");
    expect(screen.getByText("panel body")).toBeVisible();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with the keyboard via Enter and Space", async () => {
    const user = userEvent.setup();
    setPlanner({ courses: ["AE 2320"] });
    renderDisclosure();
    const button = screen.getByRole("button", { name: "Your courses (1)" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("auto-closes when the first course lands while the student is not adding", () => {
    setPlanner({ courses: [] });
    renderDisclosure();
    expect(screen.getByRole("button", { name: "Your courses" })).toHaveAttribute("aria-expanded", "true");

    act(() => setPlanner({ courses: ["AE 2320"] }));
    expect(screen.getByRole("button", { name: "Your courses (1)" })).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open after a manual open when courses are added", async () => {
    const user = userEvent.setup();
    // Start collapsed with one course, then open it by hand: that marks the session as adding.
    setPlanner({ courses: ["AE 2320"] });
    renderDisclosure();
    const button = screen.getByRole("button", { name: "Your courses (1)" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    // Adding another course must not fold the panel away mid-session.
    act(() => setPlanner({ courses: ["AE 2320", "AE 2410"] }));
    expect(screen.getByRole("button", { name: "Your courses (2)" })).toHaveAttribute("aria-expanded", "true");
  });

  it("reopens and auto-closes again after the plan is emptied", () => {
    // Empty: open. First course with no manual open: folds away.
    setPlanner({ courses: [] });
    renderDisclosure();
    expect(screen.getByRole("button", { name: "Your courses" })).toHaveAttribute("aria-expanded", "true");
    act(() => setPlanner({ courses: ["AE 2320"] }));
    expect(screen.getByRole("button", { name: "Your courses (1)" })).toHaveAttribute("aria-expanded", "false");

    // Emptied again: reopens.
    act(() => setPlanner({ courses: [] }));
    expect(screen.getByRole("button", { name: "Your courses" })).toHaveAttribute("aria-expanded", "true");
  });

  it("stays open while a first-plan guide is active", () => {
    setPlanner({ courses: ["AE 2320"] });
    const guide = document.createElement("div");
    guide.className = "guide-popover";
    document.body.appendChild(guide);
    try {
      renderDisclosure();
      expect(screen.getByRole("button", { name: "Your courses (1)" })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("panel body")).toBeVisible();
    } finally {
      guide.remove();
    }
  });

  it("is hidden on tablet and wider screens", () => {
    setPlanner({ courses: [] });
    const { container } = renderDisclosure();
    expect(container.firstElementChild).toHaveClass("tablet:hidden");
  });
});
