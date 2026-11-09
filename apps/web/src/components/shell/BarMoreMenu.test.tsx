import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { BarMoreMenu } from "./BarMoreMenu";

function Modal({ onClose }: { onClose(): void }) {
  const { ref, handleClose } = useModalDialog(true, onClose);
  return <dialog ref={ref} onClose={handleClose} aria-label="Export"><button onClick={onClose}>Finish</button><button onClick={() => ref.current?.close()}>Close</button></dialog>;
}

function Menu() {
  const [open, setOpen] = useState(false);
  return <BarMoreMenu><button onClick={() => setOpen(true)}>Export</button>{open && <Modal onClose={() => setOpen(false)} />}</BarMoreMenu>;
}

beforeEach(() => {
  const query = document.querySelector.bind(document);
  vi.spyOn(document, "querySelector").mockImplementation((selector) => query(selector === "dialog:modal" ? "dialog[open]" : selector));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.querySelector("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => vi.restoreAllMocks());

it.each(["Finish", "Close"])("closes the menu and returns focus after %s", async (button) => {
  const user = userEvent.setup();
  render(<Menu />);
  const more = screen.getByRole("button", { name: "More actions" });
  await user.click(more);
  const exportButton = screen.getByRole("button", { name: "Export" });
  await user.click(exportButton);
  const regainedFocus = vi.fn();
  exportButton.addEventListener("focus", regainedFocus);
  await user.click(screen.getByRole("button", { name: button }));
  await waitFor(() => expect(more).toHaveAttribute("aria-expanded", "false"));
  expect(more).toHaveFocus();
  expect(regainedFocus).not.toHaveBeenCalled();
  await user.click(more);
  screen.getByRole("button", { name: "Export" }).focus();
  expect(more).toHaveAttribute("aria-expanded", "true");
});
