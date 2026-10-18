import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const terms = [
  { value: "2027-C", label: "C Term · Spring 2027" },
  { value: "2027-D", label: "D Term · Spring 2027" },
];

describe("Select", () => {
  it("is labelled even when the label is hidden", () => {
    render(<Select label="Term" options={terms} defaultValue="2027-C" />);
    expect(screen.getByRole("combobox", { name: "Term" })).toHaveValue("2027-C");
  });

  it("shows the label as visible text in the pill variant", () => {
    render(<Select variant="pill" label="Starts after" options={terms} />);
    expect(screen.getByText("Starts after")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Starts after" })).toBeInTheDocument();
  });

  it("can show the label above a box, and clicking it focuses the select", async () => {
    render(<Select variant="box" label="Professor" hideLabel={false} options={terms} />);
    await userEvent.click(screen.getByText("Professor"));
    expect(screen.getByRole("combobox", { name: "Professor" })).toHaveFocus();
    expect(screen.getByText("Professor")).not.toHaveClass("sr-only");
  });

  it("reports changes", async () => {
    const onChange = vi.fn();
    render(<Select label="Term" options={terms} defaultValue="2027-C" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Term" }), "2027-D");
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole("combobox", { name: "Term" })).toHaveValue("2027-D");
  });
});
