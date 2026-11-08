import { render, screen } from "@testing-library/react";
import { beforeAll, expect, it, vi } from "vitest";
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

it("starts on the part marked to take focus, instead of the first button", () => {
  function Form() {
    const { ref, handleClose } = useModalDialog(true, () => {});
    return <dialog ref={ref} onClose={handleClose} aria-label="Form"><button type="button">Close</button><div data-autofocus><button type="button">Field</button></div></dialog>;
  }
  render(<Form />);
  expect(screen.getByRole("button", { name: "Field" })).toHaveFocus();
});
