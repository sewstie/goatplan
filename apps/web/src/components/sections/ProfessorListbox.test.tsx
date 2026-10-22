import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { lectureProfessorTerm } from "@/lib/store/testing/lectureProfessors";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { startTestPlanner, waitForSolve } from "./testing/plannerStore";

it("offers lecture counts and co-teaching, picks every matching lecture and clears without changing locks or availability", async () => {
  const user = userEvent.setup();
  const preferences = { startsAfter: 540, blocked: [{ day: "Fri" as const, start: 840, end: 960 }], onlyOpen: true };
  const locks = { "AE 2320": ["AE 2320-CX01", "AE 2320-CD01"] };
  const { store, requests } = await startTestPlanner({ courses: ["AE 2320"], preferences, locks }, { term: lectureProfessorTerm() });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);
  const field = screen.getByRole("combobox", { name: "Lecture professor" });
  await user.click(field);
  expect(screen.getByRole("listbox")).toBeInTheDocument();
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Any professorAll 6 lecture times", "Ye Lu4 lecture times · includes co-teaching", "Alex Smith1 co-taught lecture", "Mark Richman2 lecture times",
  ]);
  expect(screen.queryByRole("option", { name: "Lab Tutor" })).not.toBeInTheDocument();
  await user.keyboard("y{Enter}");
  await waitForSolve(store);
  expect(store.getState().professorByCourse["AE 2320"]).toBe("Ye Lu");
  expect(requests.at(-1)?.preferences?.anyOf).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CL02", "AE 2320-CL05", "AE 2320-CL06"] });
  await user.keyboard("{Enter}{Home}{Enter}");
  await waitForSolve(store);
  expect(store.getState().professorByCourse["AE 2320"]).toBeNull();
  expect(requests.at(-1)?.preferences).toMatchObject({ ...preferences, locked: locks, anyOf: {} });
  expect(field).toHaveTextContent("Any professor");
});
