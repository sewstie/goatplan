import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { keepClickFocus } from "./keepClickFocus";

describe("keepClickFocus", () => {
  it("stops a click on empty space from focusing the scroll area but lets buttons take focus", () => {
    render(<div tabIndex={0} role="group" aria-label="Plan" onMouseDown={keepClickFocus}><p>Empty</p><button type="button">Course</button></div>);
    expect(fireEvent.mouseDown(screen.getByText("Empty"))).toBe(false);
    expect(fireEvent.mouseDown(screen.getByRole("button", { name: "Course" }))).toBe(true);
  });
});
