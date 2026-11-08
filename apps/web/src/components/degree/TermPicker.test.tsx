import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TermPicker } from "./TermPicker";

function Picker({ start = "A Term 2026" }: { start?: string }) {
  const [value, setValue] = useState(start);
  return <TermPicker label="Term" value={value} onChange={setValue} startYear={2026} current={{ letter: "B", year: 2026 }} allowNone />;
}

describe("the term picker", () => {
  it("shows school years with summer, marks now and never offers terms outside the plan", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.click(screen.getByRole("button", { name: /^Term A Term 2026/ }));
    expect(screen.getByRole("button", { name: "B Term 2026, current term" })).toBeVisible();
    expect(screen.getByRole("button", { name: "E Term 2027, summer" })).toBeVisible();
    expect(screen.getByRole("button", { name: "A Term 2026, past" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /C Term 2026|E Term 2030/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual(["Year 12026–27", "Year 22027–28", "Year 32028–29", "Year 42029–30"]);
  });

  it("can leave out summer, for choices like project blocks", async () => {
    const user = userEvent.setup();
    render(<TermPicker label="Term" value="B Term 2028" onChange={() => {}} startYear={2026} current={{ letter: "B", year: 2026 }} summer={false} />);
    await user.click(screen.getByRole("button", { name: /^Term B Term 2028/ }));
    expect(screen.queryByRole("button", { name: /^E Term/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("gridcell", { name: "Not available in summer" })).toHaveLength(3);
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("button", { name: /^D Term 2029/ })).toHaveFocus();
  });

  it("moves across terms and years with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    screen.getByRole("button", { name: /^Term A Term 2026/ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "A Term 2026, past" })).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}{Enter}");
    expect(screen.getByRole("button", { name: /^Term C Term 2028/ })).toHaveFocus();
  });

  it("closes on Escape without changing the term, and can clear it", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.click(screen.getByRole("button", { name: /^Term A Term 2026/ }));
    await user.keyboard("{ArrowRight}{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Term A Term 2026/ })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: /^Term A Term 2026/ }));
    await user.click(screen.getByRole("button", { name: /^No term/ }));
    expect(screen.getByRole("button", { name: /^Term No term/ })).toBeVisible();
  });

  it("gives focus back to its button when Tab leaves the grid", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.click(screen.getByRole("button", { name: /^Term A Term 2026/ }));
    await user.tab();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Term A Term 2026/ })).toHaveFocus();
  });
});
