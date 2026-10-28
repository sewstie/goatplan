import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { rateMyProfessorsUrl } from "@/lib/data";
import type { TermFile } from "@/lib/data/types";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import { lectureProfessorTerm } from "@/lib/store/testing/lectureProfessors";
import { ChooseAlternativeSheet } from "./ChooseAlternativeSheet";
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

/** The fixture term with a third AE 2320 lab, CX03, with more open seats than the others. */
function termWithThreeLabs(): TermFile {
  const term = termWithSameTimeLabs();
  const course = term.courses[0];
  const cx02 = course.sections[2];
  course.sections.push({ ...cx02, id: "AE 2320-CX03", code: "CX03", enrolled: 5 });
  course.options.push(["AE 2320-CL01", "AE 2320-CX03"]);
  return term;
}

/** One schedule in which CX01, CX02 and CX03 all meet at the same time. */
function threeSameTimeLabs(request: SolveRequest): SolveResponse {
  const response = solved(request);
  if (!response.ok) return response;
  const [schedule] = response.schedules;
  const courses = schedule.courses.map((course) =>
    course.code === "AE 2320"
      ? { ...course, alternatives: [...course.alternatives, ["AE 2320-CL01", "AE 2320-CX03"]] }
      : course,
  );
  return { ...response, total: 1, schedules: [{ ...schedule, courses }] };
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

function renderPanelAndSheet() {
  render(
    <>
      <CourseDetailsPanel />
      <ChooseAlternativeSheet />
      <ScheduleView />
    </>,
  );
}

async function openCalendarChoices() {
  const block = screen.getByRole("button", { name: /^AE 2320 CX01,/ });
  await userEvent.click(block);
  await userEvent.click(block);
  return block;
}

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

    const picker = screen.getByRole("combobox", { name: "Lecture professor" });
    expect(picker).toHaveTextContent("Any professor");
    expect(screen.getByRole("link", { name: /Rate My Professors/ })).toBeInTheDocument();
    await chooseProfessor(picker, "Ye Lu");
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
      "Any professorAll 6 lecture times", "Ye Lu4 lecture times · includes co-teaching", "Alex Smith1 co-taught lecture", "Mark Richman2 lecture times",
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
    expect(screen.getByRole("link", { name: /Rate My Professors: Ye Lu/ })).toHaveAttribute("href", rateMyProfessorsUrl("Ye Lu"));
    await chooseProfessor(picker, "Other Professor");
    await waitForSolve(store);
    expect(screen.getByRole("link", { name: /Rate My Professors: Other Professor/ })).toHaveAttribute("href", rateMyProfessorsUrl("Other Professor"));
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
    expect(screen.getByRole("combobox", { name: "Lecture professor" })).toHaveTextContent("Any professor");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("ChooseAlternativeSheet", () => {
  it("lists the same-time labs and applies the suggested one through the store", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term: termWithSameTimeLabs() });
    renderPanelAndSheet();

    await openCalendarChoices();
    const sheet = screen.getByRole("dialog", { name: "Choose a lab" });
    expect(within(sheet).getByText(/fit around the rest of your schedule/)).toHaveFocus();
    expect(within(sheet).getByRole("button", { name: "Close" })).not.toHaveFocus();
    const group = within(sheet).getByRole("group", { name: "Other lab choices" });
    expect(within(group).getByText(/your lab now/).parentElement).toHaveTextContent("CX01, your lab now");
    expect(within(group).getByRole("radio", { name: /CX02/ })).not.toBeChecked();
    expect(within(group).getAllByText("30 open")).toHaveLength(2);

    await userEvent.click(within(sheet).getByRole("button", { name: "Pick CX02" }));

    const key = Object.keys(store.getState().alternatives)[0];
    expect(store.getState().alternatives[key]).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
    expect(store.getState().solveStatus).toBe("done");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lab CX02" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^AE 2320 CX02,/ })).toHaveFocus();
  });

  it("suggests the most open seats, and picks the row chosen instead", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term: termWithThreeLabs(), solve: threeSameTimeLabs });
    renderPanelAndSheet();

    await openCalendarChoices();
    const sheet = screen.getByRole("dialog", { name: "Choose a lab" });
    expect(within(sheet).getByRole("button", { name: "Pick CX03" })).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole("radio", { name: /CX02/ }));
    expect(within(sheet).getByRole("radio", { name: /CX02/ })).toBeChecked();
    await userEvent.click(within(sheet).getByRole("button", { name: "Pick CX02" }));

    const key = Object.keys(store.getState().alternatives)[0];
    expect(store.getState().alternatives[key]).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
  });

  it("lists labs at other times and switches to the schedule that has the one picked", async () => {
    const { store, requests } = await startTestPlanner(
      { courses: ["AE 2320"] },
      { term: termWithTimedLabs(), solve: labsByTime() },
    );
    renderPanelAndSheet();

    await openCalendarChoices();
    const sheet = screen.getByRole("dialog", { name: "Choose a lab" });
    expect(within(sheet).getByText(/your lab now/).parentElement?.nextElementSibling).toHaveTextContent(
      /^Thu · 2:00 PM–2:50 PM$/,
    );
    // CX02 and CX04 meet at the same time, so their rooms say which is which.
    expect(within(sheet).getByRole("radio", { name: /^CX02\s*Thu · 3:00 PM–3:50 PM · Higgins Labs 230/ })).toBeInTheDocument();
    expect(within(sheet).getByRole("radio", { name: /^CX04\s*Thu · 3:00 PM–3:50 PM · Higgins Labs 231/ })).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole("radio", { name: /CX04/ }));
    await userEvent.click(within(sheet).getByRole("button", { name: "Pick CX04" }));

    expect(store.getState()).toMatchObject({ scheduleIndex: 1, locks: {} });
    expect(screen.getByRole("heading", { name: "Lab CX04" })).toBeInTheDocument();
    expect(requests).toHaveLength(1);
  });

  it("locks a lab that no schedule in the answer has, and solves again", async () => {
    const { store, requests } = await startTestPlanner(
      { courses: ["AE 2320"] },
      { term: termWithTimedLabs(), solve: labsByTime(false) },
    );
    renderPanelAndSheet();

    await openCalendarChoices();
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("radio", { name: /CX02/ }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Pick CX02" }));

    expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX02"] });
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.locked).toEqual({ "AE 2320": ["AE 2320-CX02"] });
  });

  it("closes without changing anything", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term: termWithSameTimeLabs() });
    renderPanelAndSheet();

    await openCalendarChoices();
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
