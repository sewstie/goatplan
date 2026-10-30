import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { rateMyProfessorsUrl } from "@/lib/data";
import type { TermFile } from "@/lib/data/types";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import { lectureProfessorTerm } from "@/lib/store/testing/lectureProfessors";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { polyfillDialog, startTestPlanner, waitForSolve } from "./testing/plannerStore";
import { orbitalMechanics } from "./testing/sections";
import { ScheduleView } from "@/components/schedule/ScheduleView";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("./testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

const nothingFits = (): SolveResponse => ({
  ok: true,
  version: 1,
  termId: "2027-C",
  total: 0,
  patterns: 0,
  capped: false,
  steps: 1,
  elapsedMs: 1,
  schedules: [],
  diagnosis: { unsure: false, emptyCourses: [], clashingPairs: [], minimalClash: [], fixes: [] },
});

function termWithSameTimeLabs(): TermFile {
  const term = termFile("2027-C");
  for (const section of term.courses[0].sections) {
    if (section.type === "lab") {
      section.meetings = [{ days: ["Thu"], start: 840, end: 890, location: "Higgins Labs 230" }];
    }
  }
  return term;
}

/** The fixture term with AE 2320's labs at different times: CX01 Thu 2 PM, CX02 and CX04 Thu 3 PM. */
function termWithTimedLabs(): TermFile {
  const term = termFile("2027-C");
  term.courses[0] = orbitalMechanics;
  return term;
}

/** One schedule per lab time, as the engine would send them; `withCx02` false leaves out the 3 PM one. */
function labsByTime(withCx02 = true) {
  return (request: SolveRequest): SolveResponse => {
    const response = solved(request);
    if (!response.ok) return response;
    const [template] = response.schedules;
    const withLab = (sections: string[], alternatives: string[][]) => ({
      ...template,
      courses: template.courses.map((course) =>
        course.code === "AE 2320" ? { ...course, sections, alternatives } : course,
      ),
    });
    const cx01 = withLab(["AE 2320-CL01", "AE 2320-CX01"], [["AE 2320-CL01", "AE 2320-CX01"]]);
    const cx02 = withLab(["AE 2320-CL01", "AE 2320-CX02"], [
      ["AE 2320-CL01", "AE 2320-CX02"],
      ["AE 2320-CL01", "AE 2320-CX04"],
    ]);
    const schedules = withCx02 ? [cx01, cx02] : [cx01];
    return { ...response, total: schedules.length, patterns: schedules.length, schedules };
  };
}

const card = (name: string) => screen.getByRole("heading", { name }).closest("article") as HTMLElement;

async function chooseProfessor(picker: HTMLElement, name: string) {
  await userEvent.click(picker);
  await userEvent.click(screen.getByRole("option", { name: name || "Any professor" }));
}

describe("CourseDetailsPanel", () => {
  it("shows a loading state while the term loads", async () => {
    await startTestPlanner({}, { loadTerm: () => new Promise(() => {}), wait: false });
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading course details…");
  });

  it("shows nothing when the term can't load", async () => {
    const { store } = await startTestPlanner({}, { loadTerm: async () => Promise.reject(new Error("offline")), wait: false });
    const { container } = render(<CourseDetailsPanel />);

    await waitFor(() => expect(store.getState().termStatus).toBe("error"));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the intro before any course is added", async () => {
    await startTestPlanner();
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("heading", { name: "Your term starts here" })).toBeInTheDocument();
    expect(screen.getByText("Search for a course or professor.")).toBeInTheDocument();
  });

  it("shows the chosen sections with their facts", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();
    const lecture = card("Lecture CL01");
    expect(within(lecture).getByText("Only lecture")).toBeInTheDocument();
    expect(within(lecture).queryByRole("button")).not.toBeInTheDocument();
    expect(within(lecture).getByText("Mon · 9:00 AM–9:50 AM")).toBeInTheDocument();
    expect(within(lecture).getByText("Unity Hall 400")).toBeInTheDocument();
    expect(within(lecture).getByText("30 of 40 seats open")).toBeInTheDocument();
    expect(within(lecture).getByText("Ye Lu")).toBeInTheDocument();
    expect(within(card("Lab CX01")).getByRole("button", { name: "Lock Lab CX01" })).toBeInTheDocument();
  });

  it("removes the open course, leaving Undo to the toast, and moves focus to search when none are left", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<><input id="tutorial-search" aria-label="Search courses" /><CourseDetailsPanel /></>);

    await userEvent.click(screen.getByRole("button", { name: "Remove course AE 2320" }));
    expect(store.getState().courses).toEqual([]);
    expect(store.getState().removedCourse?.code).toBe("AE 2320");
    expect(screen.getByRole("textbox", { name: "Search courses" })).toHaveFocus();
  });

  it("locks and unlocks a section", async () => {
    const { store, requests } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<CourseDetailsPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Lock Lab CX01" }));
    expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01"] });
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.locked).toEqual({ "AE 2320": ["AE 2320-CX01"] });

    await userEvent.click(await screen.findByRole("button", { name: "Unlock Lab CX01" }));
    expect(store.getState().locks).toEqual({});
    expect(await screen.findByRole("button", { name: "Lock Lab CX01" })).toBeInTheDocument();
  });

  it("keeps locked sections on screen when nothing fits, so they can be unlocked", async () => {
    const { store } = await startTestPlanner(
      { courses: ["AE 2320"], locks: { "AE 2320": ["AE 2320-CX02"] } },
      { solve: nothingFits },
    );
    render(<CourseDetailsPanel />);

    expect(screen.getByText("No schedule fits with this course right now.")).toBeInTheDocument();
    await userEvent.click(within(card("Lab CX02")).getByRole("button", { name: "Unlock Lab CX02" }));
    expect(store.getState().locks).toEqual({});
    expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toHaveFocus();
  });

  it("doesn't claim that nothing fits when the engine gave an error", async () => {
    await startTestPlanner(
      { courses: ["AE 2320"] },
      { solve: () => ({ ok: false, version: 1, error: { code: "internal", message: "Broken", detail: null } }) },
    );
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();
    expect(screen.queryByText(/No schedule fits/)).not.toBeInTheDocument();
  });

  it("doesn't claim that nothing fits when the engine crashed", async () => {
    const { store } = await startTestPlanner(
      { courses: ["AE 2320"] },
      {
        solve: () => {
          throw new Error("Worker crashed");
        },
      },
    );
    render(<CourseDetailsPanel />);

    expect(store.getState().solveStatus).toBe("error");
    expect(screen.queryByText(/No schedule fits/)).not.toBeInTheDocument();
  });

  it("links the shown lecture instructor to Rate My Professors", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<CourseDetailsPanel />);

    expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Rate My Professors/ });
    expect(link).toHaveAttribute("href", rateMyProfessorsUrl("Ye Lu"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("offers only lecture professors and clears the choice without changing availability", async () => {
    const preferences = { startsAfter: 540, blocked: [{ day: "Mon" as const, start: 660, end: 710 }], onlyOpen: true };
    const { store, requests } = await startTestPlanner({ courses: ["AE 2320"], preferences }, { term: lectureProfessorTerm() });
    render(<CourseDetailsPanel />);
    const picker = screen.getByRole("combobox", { name: "Lecture professor" });
    await userEvent.click(picker);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Any professor", "Ye Lu", "Alex Smith", "Mark Richman",
    ]);
    await userEvent.keyboard("{Escape}");
    picker.focus();
    expect(picker).toHaveFocus();
    await chooseProfessor(picker, "Ye Lu");
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.anyOf).toEqual({ "AE 2320": [
      "AE 2320-CL01", "AE 2320-CL02", "AE 2320-CL05", "AE 2320-CL06",
    ] });
    await chooseProfessor(picker, "");
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences).toMatchObject({ ...preferences, anyOf: {} });
    expect(picker).toHaveTextContent("Any professor");
  });

  it("omits the professor filter without lectures and keeps section locking", async () => {
    const term = termFile("2027-C");
    term.courses[0].sections[0].type = "seminar";
    const { store, requests } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
    render(<CourseDetailsPanel />);
    expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lock Lab CX01" }));
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.locked).toEqual({ "AE 2320": ["AE 2320-CX01"] });
  });

  it("re-solves on professor changes while keeping the locked section", async () => {
    const term = termFile("2027-C");
    term.courses[0].sections[1].instructors = ["Other Professor"];
    term.courses[0].sections[1].type = "lecture";
    const { store, requests } = await startTestPlanner({ courses: ["AE 2320"], locks: { "AE 2320": ["AE 2320-CX01"] } }, { term });
    render(<CourseDetailsPanel />);
    const picker = screen.getByRole("combobox", { name: "Lecture professor" });
    await userEvent.click(picker);
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Any professor");
    await userEvent.keyboard("{Escape}");
    await chooseProfessor(picker, "Ye Lu");
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.anyOf).toEqual({ "AE 2320": ["AE 2320-CL01"] });
    expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01"] });
    expect(screen.queryByText(/Unlocked .* for this professor/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Ye Lu on Rate My Professors/ })).toHaveAttribute("href", rateMyProfessorsUrl("Ye Lu"));
    await chooseProfessor(picker, "Other Professor");
    await waitForSolve(store);
    expect(screen.getByRole("link", { name: /View Other Professor on Rate My Professors/ })).toHaveAttribute("href", rateMyProfessorsUrl("Other Professor"));
    await chooseProfessor(picker, "");
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.anyOf).toEqual({});
    expect(screen.getAllByRole("link", { name: /Rate My Professors/ })).toHaveLength(2);
  });

  it("follows the selected course, and says so after a click on its calendar block", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320", "AE 2410"] });
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();
    expect(screen.queryByText("Selected course")).not.toBeInTheDocument();
    act(() => store.getState().selectCourse("AE 2410", "AE 2410-C01"));
    expect(screen.getByRole("heading", { level: 2, name: "AE 2410" })).toBeInTheDocument();
    expect(screen.getByText("Selected course")).toBeInTheDocument();
  });

  it("shows a room as building and number, with the full name as its title", async () => {
    const term = termWithTimedLabs();
    term.courses[0].sections[1].meetings[0].location = "Higgins Labs 230 Geom Modeling Computer Lab";
    await startTestPlanner({ courses: ["AE 2320"] }, { term, solve: labsByTime() });
    render(<CourseDetailsPanel />);

    const room = within(card("Lab CX01")).getByText("Higgins Labs 230");
    expect(room).toHaveAttribute("title", "Higgins Labs 230 Geom Modeling Computer Lab");
  });

  it("explains a missing instructor instead of offering reviews", async () => {
    const term = termFile("2027-C");
    term.courses[1].sections[0].instructors = [];
    await startTestPlanner({ courses: ["AE 2410"] }, { term });
    render(<CourseDetailsPanel />);

    expect(within(card("Lecture C01")).getByText("Instructor not assigned yet")).toBeInTheDocument();
    expect(screen.getByText("Professor reviews appear when an instructor is available.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("calendar blocks", () => {
  it("opens no section sheet when a selected block is clicked again", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term: termWithSameTimeLabs() });
    render(<><CourseDetailsPanel /><ScheduleView /></>);
    const block = screen.getByRole("button", { name: /^AE 2320 CX01,/ });
    await userEvent.click(block);
    expect(block).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(block);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(block).toHaveAttribute("aria-pressed", "false");
    expect(store.getState().alternatives).toEqual({});
  });
});

describe("Needs attention", () => {
  it("names the course with the problem, not the selected one", async () => {
    const blocked = (): SolveResponse => ({
      ...(nothingFits() as Extract<SolveResponse, { ok: true }>),
      diagnosis: {
        unsure: false,
        emptyCourses: [{ code: "AB 1533", optionsInData: 1, removed: { notLocked: 0, notAnyOf: 0, notOpen: 0, startsTooEarly: 0, blocked: 1 }, latestStartsAfter: null }],
        clashingPairs: [],
        minimalClash: [],
        fixes: [],
      },
    });
    const { store } = await startTestPlanner({ courses: ["AE 2410", "AB 1533"] }, { solve: blocked });
    act(() => store.getState().selectCourse("AE 2410"));
    render(<CourseDetailsPanel />);

    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "AB 1533" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "AE 2410" })).not.toBeInTheDocument();
  });
});
