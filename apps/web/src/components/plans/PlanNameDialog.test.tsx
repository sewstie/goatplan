import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { PlanNameDialog } from "./PlanNameDialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

function renderDialog(onSubmit = vi.fn(() => null)) {
  render(
    <PlanNameDialog
      open
      title="Save schedule"
      confirmLabel="Save"
      initialName="Plan 2"
      onSubmit={onSubmit}
      onClose={() => {}}
    />,
  );
  return { onSubmit, field: screen.getByRole("textbox", { name: "Plan name" }) };
}

describe("PlanNameDialog", () => {
  it("suggests a name, selected so typing replaces it", async () => {
    const { field } = renderDialog();
    expect(screen.getByRole("dialog", { name: "Save schedule" })).toBeInTheDocument();
    expect(field).toHaveValue("Plan 2");
    expect(field).toHaveFocus();
    await userEvent.keyboard("Mornings free{Enter}");
    expect(field).toHaveValue("Mornings free");
  });

  it("saves the trimmed name with Enter or the Save button", async () => {
    const { field, onSubmit } = renderDialog();
    await userEvent.clear(field);
    await userEvent.type(field, "  Mornings   free {Enter}");
    expect(onSubmit).toHaveBeenLastCalledWith("Mornings free");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("asks for a name instead of saving an empty one", async () => {
    const { field, onSubmit } = renderDialog();
    await userEvent.clear(field);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveAccessibleDescription("Give your plan a name.");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveFocus();
  });

  it("shows why a save failed", async () => {
    renderDialog(vi.fn(() => "Couldn’t save. Browser storage is full or blocked."));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("textbox", { name: "Plan name" })).toHaveAccessibleDescription(
      "Couldn’t save. Browser storage is full or blocked.",
    );
  });
});
