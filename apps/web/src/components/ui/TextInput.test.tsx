import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  it("is labelled and takes typing", async () => {
    render(<TextInput type="search" label="Search courses" placeholder="Course code or professor" />);
    const input = screen.getByRole("searchbox", { name: "Search courses" });
    await userEvent.type(input, "AE 2320");
    expect(input).toHaveValue("AE 2320");
  });

  it("links the hint as the description", () => {
    render(<TextInput label="Search courses" hint="Search works once sections load." disabled />);
    const input = screen.getByRole("textbox", { name: "Search courses" });
    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription("Search works once sections load.");
  });
});
