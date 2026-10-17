import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Toggle } from "./Toggle";

function ControlledToggle() {
  const [checked, setChecked] = useState(true);
  return <Toggle checked={checked} onCheckedChange={setChecked} label="Only open sections" />;
}

describe("Toggle", () => {
  it("is a switch named by its label", () => {
    render(<ControlledToggle />);
    expect(screen.getByRole("switch", { name: "Only open sections" })).toBeChecked();
  });

  it("flips with Space, Enter and clicks", async () => {
    render(<ControlledToggle />);
    const toggle = screen.getByRole("switch", { name: "Only open sections" });

    toggle.focus();
    await userEvent.keyboard(" ");
    expect(toggle).not.toBeChecked();
    await userEvent.keyboard("{Enter}");
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
