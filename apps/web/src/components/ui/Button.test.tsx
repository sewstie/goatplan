import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button", () => {
  it("is a plain button that works with the keyboard", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save schedule</Button>);
    const button = screen.getByRole("button", { name: "Save schedule" });
    expect(button).toHaveAttribute("type", "button");

    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save schedule
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save schedule" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton", () => {
  it("is named by its label", () => {
    render(<IconButton label="Next schedule" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Next schedule" })).toBeInTheDocument();
  });
});
