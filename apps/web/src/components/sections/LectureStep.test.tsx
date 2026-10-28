import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import type { Draft } from "@/lib/store/types";
import type { SolveResponse } from "@/lib/engine/types";
import { lectureProfessorTerm } from "@/lib/store/testing/lectureProfessors";
import { solved } from "@/lib/store/testing/fixtures";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { startTestPlanner, waitForSolve } from "./testing/plannerStore";

async function panel(draft: Partial<Draft> = {}, term = lectureProfessorTerm()) {
  let resume: ((result?: SolveResponse | Error) => void) | null = null;
  let paused = false;
  const { store } = await startTestPlanner({ courses: ["AE 2320"], preferences: { startsAfter: 540, blocked: [], onlyOpen: true }, ...draft }, {
    term,
    solve: (request) => {
      const response = solved(request);
      if (response.ok) {
        const options = term.courses[0].options.filter((option) => (request.preferences?.locked?.["AE 2320"] ?? []).every((id) => option.includes(id))
          && (!request.preferences?.anyOf?.["AE 2320"] || request.preferences.anyOf["AE 2320"].some((id) => option.includes(id))));
        response.total = options.length;
        response.schedules = options.map((ids) => ({ ...response.schedules[0], courses: [{ ...response.schedules[0].courses[0], sections: ids, alternatives: [ids] }] }));
      }
      return paused ? new Promise<SolveResponse>((resolve, reject) => {
        resume = (result) => result instanceof Error ? reject(result) : resolve(result ?? response);
      }) : response;
    },
  });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);
  return { store, pause: () => { paused = true; }, finish: async (result?: SolveResponse | Error) => { await act(async () => { resume?.(result); }); } };
}

it("chooses a lecture by keyboard, waits on the disabled lab disclosure, then opens fresh labs and announces the count", async () => {
  const { store, pause, finish } = await panel();
  const user = userEvent.setup();
  const disclosure = screen.getByRole("button", { name: "3 other lecture times · Unlocked" });
  await user.click(disclosure);
  const list = screen.getByRole("list", { name: "Other lecture times" });
  expect(list).toHaveAttribute("id", disclosure.getAttribute("aria-controls"));
  expect(within(list).getByText("Alex Smith")).toBeInTheDocument();
  expect(within(list).getAllByText("Rating unavailable")).toHaveLength(4);
  pause();
  await user.tab();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(store.getState().solveStatus).toBe("solving"));
  const lab = screen.getByRole("button", { name: "Hide other lab choices" });
  expect(lab).toHaveFocus();
  expect(lab).toHaveAttribute("aria-disabled", "true");
  expect(screen.queryByRole("button", { name: "Choose Lab CX02" })).not.toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Other lecture times" })).not.toBeInTheDocument();
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CL02"] });
  await finish();
  await waitFor(() => expect(lab).toHaveAttribute("aria-disabled", "false"));
  expect(lab).toHaveFocus();
  expect(screen.getByRole("button", { name: "Choose Lab CX04" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Lecture CL02 locked · 2 schedules fit");
});

it("locks the displayed lecture by keyboard, closes step 1, and waits on step 2 before announcing the result", async () => {
  const { store, pause, finish } = await panel({ locks: { "AE 2320": ["AE 2320-CD01"] } });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "3 other lecture times · Unlocked" }));
  screen.getByRole("button", { name: "Lock Lecture CL01" }).focus();
  pause();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(store.getState().solveStatus).toBe("solving"));
  const lab = screen.getByRole("button", { name: "Hide other lab choices" });
  expect(lab).toHaveFocus();
  expect(lab).toHaveAttribute("aria-disabled", "true");
  expect(lab).toHaveAttribute("aria-expanded", "true");
  expect(screen.queryByRole("list", { name: "Other lecture times" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Choose Lab CX02" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await user.keyboard("{Enter} ");
  expect(lab).toHaveAttribute("aria-expanded", "true");
  await finish();
  await waitFor(() => expect(lab).toHaveAttribute("aria-disabled", "false"));
  expect(lab).toHaveFocus();
  expect(screen.getByRole("button", { name: "Choose Lab CX02" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Unlock Lecture CL01" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Unlock Discussion CD01" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Lecture CL01 locked · 2 schedules fit");
});

it("shows Only lecture and skips the lecture chooser when the professor has one eligible lecture", async () => {
  await panel({ professorByCourse: { "AE 2320": "Alex Smith" } });
  expect(screen.getByText("Only lecture")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /other lecture time/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "View other lab choices" })).toBeInTheDocument();
});

it("focuses Unlock after choosing a lecture in a course without labs or discussions", async () => {
  const term = lectureProfessorTerm();
  const course = term.courses[0];
  course.sections = course.sections.filter((section) => section.type === "lecture");
  course.options = course.sections.map((section) => [section.id]);
  const { store } = await panel({}, term);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "3 other lecture times · Unlocked" }));
  await user.tab();
  await user.keyboard("{Enter}");
  await waitForSolve(store);
  expect(screen.getByRole("button", { name: "Unlock Lecture CL02" })).toHaveFocus();
});

it.each([
  new Error("Worker stopped"),
  { ok: false, version: 1, error: { code: "internal", message: "Engine stopped", detail: null } } satisfies SolveResponse,
])("returns focus to the course heading if the lecture solve fails without offering stale labs: %j", async (failure) => {
  const { store, pause, finish } = await panel();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "3 other lecture times · Unlocked" }));
  pause();
  await user.tab();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(store.getState().solveStatus).toBe("solving"));
  await finish(failure);
  await waitForSolve(store);
  expect(screen.getByRole("heading", { name: "AE 2320" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: /Choose CX/ })).not.toBeInTheDocument();
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CL02"] });
});

it("returns focus to the heading when unlocking the only eligible lecture hides its control", async () => {
  const { store } = await panel({ professorByCourse: { "AE 2320": "Alex Smith" }, locks: { "AE 2320": ["AE 2320-CL02"] } });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Unlock Lecture CL02" }));
  await waitForSolve(store);
  expect(screen.getByRole("heading", { name: "AE 2320" })).toHaveFocus();
  expect(screen.getByText("Only lecture")).toBeInTheDocument();
});

it("focuses the diagnosis heading if no schedules remain after choosing, preserving every lock", async () => {
  const { store, pause, finish } = await panel({ locks: { "AE 2320": ["AE 2320-CD01"] } });
  const empty = solved({ version: 1, courses: ["AE 2320"] });
  if (!empty.ok) throw new Error("Expected a successful fixture");
  empty.total = 0;
  empty.patterns = 0;
  empty.schedules = [];
  empty.diagnosis = { unsure: false, emptyCourses: [], clashingPairs: [], minimalClash: ["AE 2320"],
    fixes: [{ kind: "dropCourse", course: "AE 2320", schedules: 1, capped: false }],
  };
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "3 other lecture times · Unlocked" }));
  pause();
  await user.tab();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(store.getState().solveStatus).toBe("solving"));
  await finish(empty);
  await waitForSolve(store);
  expect(screen.getByRole("heading", { name: "AE 2320" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: /Choose CX/ })).not.toBeInTheDocument();
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CD01", "AE 2320-CL02"] });
});

it("keeps incompatible rows focusable with a reason, moves only the lecture lock, and returns to step 1 on Unlock", async () => {
  const locks = { "AE 2320": ["AE 2320-CL01", "AE 2320-CX01", "AE 2320-CD01"], "AE 2410": ["AE 2410-S01"] };
  const { store } = await panel({ courses: ["AE 2320", "AE 2410"], locks });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "3 other lecture times · Locked" }));
  await user.tab();
  await user.tab();
  const disabled = screen.getByRole("button", { name: "Choose Lecture CL03" });
  expect(disabled).toHaveFocus();
  expect(disabled).toHaveAttribute("aria-disabled", "true");
  expect(disabled).toHaveAccessibleDescription("Doesn't fit locked lab CX01");
  await user.keyboard("{Enter} ");
  expect(store.getState().locks).toEqual(locks);
  await user.tab({ shift: true });
  await user.keyboard("{Enter}");
  await waitForSolve(store);
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01", "AE 2320-CD01", "AE 2320-CL02"], "AE 2410": ["AE 2410-S01"] });
  expect(screen.getByRole("status")).toHaveTextContent("Lecture CL02 locked · 1 schedule fits");
  await user.click(screen.getByRole("button", { name: "Unlock Lecture CL02" }));
  await waitForSolve(store);
  const disclosure = screen.getByRole("button", { name: "3 other lecture times · Unlocked" });
  expect(disclosure).toHaveFocus();
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("list", { name: "Other lecture times" })).toBeInTheDocument();
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01", "AE 2320-CD01"], "AE 2410": ["AE 2410-S01"] });
  await user.tab();
  await user.keyboard("{Escape}");
  expect(disclosure).toHaveFocus();
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
});
