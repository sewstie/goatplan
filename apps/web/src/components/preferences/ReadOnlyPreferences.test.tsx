import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import type { SortPresetId } from "@/lib/store";
import { ReadOnlyPreferences } from "./ReadOnlyPreferences";

// A saved plan keeps its stored preset ID; the read-only chip names it with the menu's label.
const LABELS: [SortPresetId, string][] = [
  ["bestOverall", "Best overall"],
  ["fewestEarly", "Fewest early classes"],
  ["latestStart", "Latest start"],
  ["earliestFinish", "Earliest finish"],
  ["fewestDays", "Most days off"],
  ["fewestGaps", "Most compact"],
];

describe("ReadOnlyPreferences", () => {
  it.each(LABELS)("shows %s as “Sort %s”, with no description and nothing to pick", (sortPreset, label) => {
    render(<ReadOnlyPreferences plan={designPlan({ sortPreset })} />);

    const preferences = screen.getByRole("group", { name: "Preferences" });
    expect(preferences).toHaveTextContent(`Sort${label}`);
    expect(within(preferences).getByText(label, { exact: true })).toBeInTheDocument();
    expect(preferences).not.toHaveTextContent(/as (late|early) as possible|Fewer|balance|Less free time/);
    expect(within(preferences).queryByRole("combobox")).not.toBeInTheDocument();
  });
});
