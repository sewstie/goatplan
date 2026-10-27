import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PhoneDetailsSheet } from "./PhoneDetailsSheet";
import { getPlannerStore } from "@/lib/store";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";

// jsdom has no modal dialogs; open and close them by their attribute, and let Escape close them.
const native = { showModal: HTMLDialogElement.prototype.showModal, close: HTMLDialogElement.prototype.close };
const escapeHandlers = new WeakMap<HTMLDialogElement, (event: KeyboardEvent) => void>();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (this.dispatchEvent(new Event("cancel", { cancelable: true }))) this.close();
    };
    escapeHandlers.set(this, onEscape);
    this.ownerDocument.addEventListener("keydown", onEscape);
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.ownerDocument.removeEventListener("keydown", escapeHandlers.get(this)!);
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterAll(() => Object.assign(HTMLDialogElement.prototype, native));
afterEach(() => resetPlanner());

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open details
      </button>
      <PhoneDetailsSheet open={open} onClose={() => setOpen(false)}>
        <p>course details body</p>
      </PhoneDetailsSheet>
    </>
  );
}

describe("PhoneDetailsSheet", () => {
  it("stays closed until opened", () => {
    setPlanner({ selectedCourse: "AE 2320" });
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a bottom sheet titled with the selected course", async () => {
    const user = userEvent.setup();
    setPlanner({ selectedCourse: "AE 2320" });
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open details" }));
    const dialog = screen.getByRole("dialog", { name: "AE 2320" });
    expect(dialog).toHaveClass("rounded-t-panel", "w-full");
    expect(screen.getByText("course details body")).toBeInTheDocument();
  });

  it("falls back to a generic title when no course is selected", async () => {
    const user = userEvent.setup();
    setPlanner({ selectedCourse: null });
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open details" }));
    expect(screen.getByRole("dialog", { name: "Course details" })).toBeInTheDocument();
  });

  it("keeps the selection when closed with Escape", async () => {
    const user = userEvent.setup();
    setPlanner({ selectedCourse: "AE 2320" });
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open details" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Closing the sheet must not clear the selected course.
    expect(getPlannerStore().getState().selectedCourse).toBe("AE 2320");
  });

  it("keeps the selection when closed with the Close button", async () => {
    const user = userEvent.setup();
    setPlanner({ selectedCourse: "AE 2320" });
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open details" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getPlannerStore().getState().selectedCourse).toBe("AE 2320");
  });
});
