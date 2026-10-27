import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { Fix } from "@/lib/engine/types";
import { fixText } from "@/lib/diagnosis/diagnosisText";
import { getPlannerStore } from "@/lib/store";
import { resetPlanner, setPlanner, term } from "@/components/schedule/testing/plannerFixtures";
import { DiagnosisFixes } from "./DiagnosisFixes";

afterEach(resetPlanner);

it("applies each exact engine fix through the store and shows its schedule count", async () => {
  const applyFix = vi.fn();
  setPlanner();
  getPlannerStore().setState({ applyFix });
  const fixes: Fix[] = [
    { kind: "relaxStartsAfter", startsAfter: 540, schedules: 1, capped: false },
    { kind: "clearBlocked", schedules: 2, capped: false },
    { kind: "allowFull", schedules: 3, capped: true },
    { kind: "unlock", course: "AE 2320", schedules: 4, capped: false },
    { kind: "dropCourse", course: "AE 2410", schedules: 5, capped: false },
    { kind: "clearAnyOf", course: "AE 2320", schedules: 6, capped: false },
    { kind: "clearAnyOf", course: "AE 2320", startsAfter: 660, schedules: 18, capped: false },
  ];
  const context = { term, locks: { "AE 2320": ["AE 2320-CX01"] }, preferences: getPlannerStore().getState().preferences };
  render(<DiagnosisFixes fixes={fixes.map((fix) => fixText(fix, context))} />);
  const user = userEvent.setup();
  const buttons = screen.getAllByRole("button");
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Change to 9:00 AM1 schedule fits", "Clear blocked times2 schedules fit", "Show full sectionsAt least 3 schedules fit", "Unlock CX014 schedules fit", "Remove AE 24105 schedules fit",
    "Allow any professor for AE 23206 schedules fit",
    "Allow any professor for AE 2320 and change to 11:00 AM18 schedules fit",
  ]);
  for (const [index, button] of buttons.entries()) {
    await user.click(button);
    expect(applyFix).toHaveBeenNthCalledWith(index + 1, fixes[index]);
  }
  act(() => getPlannerStore().setState({ solveStatus: "waiting" }));
  for (const button of buttons) expect(button).toBeDisabled();
});
