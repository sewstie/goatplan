import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { useModalDialog } from "./useModalDialog";

function Modal({ onClose = () => {} }: { onClose?: () => void }) {
  const { ref, handleClose } = useModalDialog(true, onClose);
  return <dialog ref={ref} onClose={handleClose} aria-label="Modal"><button type="button">Inside</button></dialog>;
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.querySelector("button")?.focus();
  };
  HTMLDialogElement.prototype.show = function () {
    this.setAttribute("open", "");
    this.querySelector("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

it("puts focus back when the dialog is removed while it's open", () => {
  const onClose = vi.fn();
  const { rerender } = render(<><button type="button">Opener</button></>);
  screen.getByRole("button", { name: "Opener" }).focus();
  rerender(<><button type="button">Opener</button><Modal onClose={onClose} /></>);
  expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
  rerender(<><button type="button">Opener</button></>);
  expect(screen.getByRole("button", { name: "Opener" })).toHaveFocus();
});

it("falls back to the screen's heading when the opener is gone too", () => {
  const { rerender } = render(<><h1 data-screen-heading tabIndex={-1}>Title</h1><button type="button">Opener</button></>);
  screen.getByRole("button", { name: "Opener" }).focus();
  rerender(<><h1 data-screen-heading tabIndex={-1}>Title</h1><button type="button">Opener</button><Modal /></>);
  rerender(<><h1 data-screen-heading tabIndex={-1}>Title</h1></>);
  expect(screen.getByRole("heading", { name: "Title" })).toHaveFocus();
});

describe("a dialog that leaves the page usable", () => {
  function Panel({ open, takeFocus, onClose }: { open: boolean; takeFocus?: boolean; onClose: () => void }) {
    const { ref } = useModalDialog(open, onClose, { modal: false, takeFocus });
    return (
      <>
        <button type="button">First</button>
        <button type="button">Second</button>
        <dialog ref={ref} data-nonmodal aria-label="Panel">
          <button type="button">Inside</button>
        </dialog>
      </>
    );
  }

  it("closes on Escape and gives focus back to what opened it", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Panel open={false} onClose={onClose} />);
    const first = screen.getByRole("button", { name: "First" });
    first.focus();
    rerender(<Panel open onClose={onClose} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    screen.getByRole("button", { name: "Inside" }).focus();
    rerender(<Panel open={false} onClose={onClose} />);
    expect(first).toHaveFocus();
  });

  it("gives focus back to whatever was used last outside it", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Panel open={false} onClose={onClose} />);
    screen.getByRole("button", { name: "First" }).focus();
    rerender(<Panel open onClose={onClose} />);
    const second = screen.getByRole("button", { name: "Second" });
    second.focus();
    screen.getByRole("button", { name: "Inside" }).focus();
    rerender(<Panel open={false} onClose={onClose} />);
    expect(second).toHaveFocus();
  });

  it("leaves focus where it is when it opens by itself", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Panel open={false} takeFocus={false} onClose={onClose} />);
    const first = screen.getByRole("button", { name: "First" });
    first.focus();
    rerender(<Panel open takeFocus={false} onClose={onClose} />);
    expect(first).toHaveFocus();
  });

  it("doesn't take focus back if the student has moved on", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Panel open={false} onClose={onClose} />);
    screen.getByRole("button", { name: "First" }).focus();
    rerender(<Panel open onClose={onClose} />);
    const second = screen.getByRole("button", { name: "Second" });
    second.focus();
    rerender(<Panel open={false} onClose={onClose} />);
    expect(second).toHaveFocus();
  });

  it("leaves Escape to a modal dialog that's open on top", () => {
    const onClose = vi.fn();
    render(<Panel open onClose={onClose} />);
    const modal = document.createElement("dialog");
    modal.setAttribute("open", "");
    document.body.append(modal);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    modal.remove();
  });
});
