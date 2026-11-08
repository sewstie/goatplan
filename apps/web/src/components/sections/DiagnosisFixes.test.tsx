import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { Fix } from "@/lib/engine/types";
import { fixText } from "@/lib/diagnosis/diagnosisText";
import { getPlannerStore } from "@/lib/store";
import type { PlanFix } from "@/lib/store";
import { resetPlanner, setPlanner, term } from "@/components/schedule/testing/plannerFixtures";
import { DiagnosisFixes } from "./DiagnosisFixes";

afterEach(resetPlanner);

const context = () => ({ term, locks: { "AE 2320": ["AE 2320-CX01"] }, preferences: getPlannerStore().getState().preferences });

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
  render(<DiagnosisFixes fixes={fixes.map((fix) => fixText(fix, context()))} />);
  const user = userEvent.setup();
  expect(screen.getByRole("heading", { name: "Ways to fix it" })).toBeVisible();
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

it("lists other professors in their own group, first, and switches with the keyboard", async () => {
  const applyFix = vi.fn();
  setPlanner();
  getPlannerStore().setState({ applyFix, checkingProfessors: true });
  const fixes: PlanFix[] = [
    { kind: "switchProfessor", course: "AE 2320", professor: "Ye Lu", schedules: 3, capped: false },
    { kind: "dropCourse", course: "AE 2320", schedules: 5, capped: false },
  ];
  render(<DiagnosisFixes fixes={fixes.map((fix) => fixText(fix, context()))} />);
  const professors = screen.getByRole("region", { name: "Try another professor" });
  const others = screen.getByRole("region", { name: "Other ways to fix it" });
  const switchButton = within(professors).getByRole("button", { name: "Switch AE 2320 to Ye Lu, 3 schedules fit" });
  expect(switchButton).toHaveTextContent("Ye LuAE 2320 · 3 schedules fit");
  expect(within(professors).getByRole("status")).toHaveTextContent("Checking other professors…");
  expect(within(others).getByRole("button", { name: /^Remove AE 2320/ })).toBeVisible();

  switchButton.focus();
  await userEvent.setup().keyboard("{Enter}");
  expect(applyFix).toHaveBeenCalledWith(fixes[0]);
});
