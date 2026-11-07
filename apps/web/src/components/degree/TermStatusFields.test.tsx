import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { stateForTerm } from "@/lib/degree/planGrid";
import { termForState, TermStatusFields, type TermAndState } from "./TermStatusFields";

const current = { letter: "B" as const, year: 2026 };

function Fields({ start }: { start: TermAndState }) {
  const [value, setValue] = useState(start);
  return <TermStatusFields {...value} onChange={setValue} startYear={2026} current={current} />;
}

describe("term and status together", () => {
  it("moves the term so the chosen status is what gets saved", () => {
    expect(termForState("progress", "A Term 2026", current)).toBe("B Term 2026");
    expect(termForState("planned", "B Term 2026", current)).toBe("C Term 2027");
    expect(termForState("planned", "A Term 2026", current)).toBe("C Term 2027");
    expect(termForState("planned", "D Term 2027", current)).toBe("D Term 2027");
    expect(termForState("planned", "", current)).toBe("");
    expect(termForState("taken", "B Term 2026", current)).toBe("B Term 2026");
  });

  it("picking Planned in the current term keeps it planned after it's read back", async () => {
    const user = userEvent.setup();
    render(<Fields start={{ term: "B Term 2026", state: "progress" }} />);
    await user.click(screen.getByRole("button", { name: "Planned" }));
    expect(screen.getByRole("button", { name: /^Term C Term 2027/ })).toBeVisible();
    expect(stateForTerm({ letter: "C", year: 2027 }, current)).toBe("planned");
  });

  it("picking a term sets the status from it", async () => {
    const user = userEvent.setup();
    render(<Fields start={{ term: "", state: "taken" }} />);
    await user.click(screen.getByRole("button", { name: /^Term No term/ }));
    await user.click(screen.getByRole("button", { name: "B Term 2026, current term" }));
    expect(screen.getByRole("button", { name: "In progress" })).toHaveAttribute("aria-pressed", "true");
  });
});
