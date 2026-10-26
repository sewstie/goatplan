import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Sheet, type SheetSide } from "./Sheet";

// jsdom has no modal dialogs. This stands in for the browser: showModal opens the dialog, and
// Escape (unless something inside already handled it) sends `cancel` and then closes it.
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

afterAll(() => {
  Object.assign(HTMLDialogElement.prototype, native);
});

function SheetExample({ side }: { side?: SheetSide }) {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(0);
  return (
    <>
      <button type="button">Before</button>
      <button type="button" onClick={() => setOpen(true)}>
        AE 2320
      </button>
      <Sheet
        side={side}
        open={open}
        onClose={() => {
          setOpen(false);
          setClosed(closed + 1);
        }}
        title="AE 2320"
      >
        <p>Sections in this schedule</p>
        <button type="button">Lock CX01</button>
        <button type="button" disabled>
          Locked
        </button>
        <a href="https://www.ratemyprofessors.com">Rate My Professors</a>
      </Sheet>
      <button type="button">After</button>
      <p>Closed {closed}</p>
    </>
  );
}

async function openSheet(side?: SheetSide) {
  const user = userEvent.setup();
  render(<SheetExample side={side} />);
  const opener = screen.getByRole("button", { name: "AE 2320" });
  await user.click(opener);
  return { user, opener, sheet: screen.getByRole("dialog", { name: "AE 2320" }) };
}

describe("Sheet", () => {
  it("keeps the right side as the default", async () => {
    const { sheet } = await openSheet();
    expect(sheet).toHaveClass("ml-auto", "h-dvh", "rounded-l-panel");
    expect(sheet).not.toHaveClass("rounded-t-panel");
  });

  it("opens across the bottom: full width, at most 85% of the screen, rounded top corners, scrolling inside", async () => {
    const { sheet } = await openSheet("bottom");
    expect(sheet).toHaveAttribute("open");
    expect(sheet).toHaveClass("mt-auto", "mb-0", "w-full", "max-w-none", "max-h-[85dvh]", "rounded-t-panel");
    expect(sheet).not.toHaveClass("rounded-l-panel", "h-dvh");
    expect(sheet.firstElementChild).toHaveClass("max-h-[85dvh]", "overflow-y-auto");
  });

  it("slides up, with the slide turned off for reduced motion", async () => {
    const { sheet } = await openSheet("bottom");
    expect(sheet).toHaveClass("starting:translate-y-full", "motion-reduce:transition-none");
  });

  it.each(["bottom", "right"] as const)("moves focus to its heading on open (%s)", async (side) => {
    await openSheet(side);
    expect(screen.getByRole("heading", { name: "AE 2320" })).toHaveFocus();
  });

  it("keeps Tab and Shift+Tab inside the sheet", async () => {
    const { user, sheet } = await openSheet("bottom");
    const close = screen.getByRole("button", { name: "Close" });
    const lock = screen.getByRole("button", { name: "Lock CX01" });
    const link = screen.getByRole("link", { name: "Rate My Professors" });

    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    expect(lock).toHaveFocus();
    await user.tab();
    expect(link).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(link).toHaveFocus();
    await user.tab({ shift: true });
    expect(lock).toHaveFocus();

    for (let step = 0; step < 8; step++) {
      await user.tab({ shift: step % 3 === 0 });
      expect(sheet).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("goes back from the heading to the last control with Shift+Tab", async () => {
    const { user } = await openSheet("bottom");
    await user.tab({ shift: true });
    expect(screen.getByRole("link", { name: "Rate My Professors" })).toHaveFocus();
  });

  it("closes with Escape and returns focus to what opened it", async () => {
    const { user, opener } = await openSheet("bottom");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(screen.getByText("Closed 1")).toBeInTheDocument();
  });

  it("closes with Close and returns focus to what opened it", async () => {
    const { user, opener } = await openSheet("bottom");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("closes on a tap on the backdrop, but not when a press inside ends on the backdrop", async () => {
    const { opener, sheet } = await openSheet("bottom");
    fireEvent.pointerDown(screen.getByText("Sections in this schedule"));
    fireEvent.click(sheet);
    expect(sheet).toHaveAttribute("open");

    fireEvent.pointerDown(sheet);
    fireEvent.click(sheet);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
