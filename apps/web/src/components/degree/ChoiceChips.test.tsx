import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ChoiceChips } from "./ChoiceChips";

function Score() {
  const [value, setValue] = useState("");
  return <><button type="button">Before</button><ChoiceChips label="Score" options={["5", "4", "3"].map((item) => ({ value: item, label: item }))} value={value} onChange={setValue} /></>;
}

describe("choice chips", () => {
  it("can be reached by Tab before anything is chosen, and arrows choose", async () => {
    const user = userEvent.setup();
    render(<Score />);
    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(screen.getByRole("radio", { name: "5" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "4" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "4" })).toHaveAttribute("aria-checked", "true");
  });
});
