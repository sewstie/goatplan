import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("shows label, value and detail as text", () => {
    render(<Chip label="Blocked" value="Work" detail="· Tue, Fri 2 PM–4 PM" />);
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("· Tue, Fri 2 PM–4 PM")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has a named remove button", async () => {
    const onRemove = vi.fn();
    render(<Chip label="Blocked" value="Work" onRemove={onRemove} removeLabel="Remove Work block" />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Work block" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("becomes one button when clickable", async () => {
    const onClick = vi.fn();
    render(
      <Chip variant="dashed" onClick={onClick}>
        Block a time
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Block a time" });
    chip.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is a toggle button when it has a pressed state", async () => {
    const { rerender } = render(<Chip variant="dashed" pressed={false} onClick={() => {}}>Block a time</Chip>);
    expect(screen.getByRole("button", { name: "Block a time" })).toHaveAttribute("aria-pressed", "false");
    rerender(<Chip variant="dashed" pressed onClick={() => {}}>Drawing busy times</Chip>);
    const chip = screen.getByRole("button", { name: "Drawing busy times" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip.className).toContain("bg-accent-soft");
    expect(chip.className).not.toContain("border-dashed");
  });
});
