import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeAll, expect, it, vi } from "vitest";
import { TermPicker } from "@/components/courses/TermPicker";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { ScheduleSwitcher } from "@/components/schedule/ScheduleSwitcher";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { PlannerProvider } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { emptyDraft, writeDraft, type DraftStorage } from "@/lib/store/draft";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import { FirstPlanTutorial } from "./FirstPlanTutorial";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { polyfillDialog } from "@/components/sections/testing/plannerStore";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";

beforeAll(polyfillDialog);

let planner: ReturnType<typeof createPlannerStore>;

function start(
  loadTerm = async (id: string) => termFile(id),
  solve: (request: SolveRequest) => Promise<SolveResponse> = async (request) => solved(request),
) {
  const storage = new MemoryStorage();
  planner = createPlannerStore({
    engine: { loadTerm: async (id) => loaded(id), solve },
    loadTermIndex: async () => ({ terms: [termSummary("2027-C"), termSummary("2027-D")] }),
    loadTerm,
    takeTermBuffer: () => null,
    storage,
    solveDelayMs: 0,
    now: () => new Date("2026-10-21T12:00:00Z"),
  });
  return storage;
}

function view(storage: DraftStorage | null = new MemoryStorage()) {
  return render(
    <PlannerProvider store={planner}>
      <FirstPlanTutorial storage={storage} />
      <TermPicker />
      <CourseSearchPanel />
      <PreferencesBar />
      <CourseDetailsPanel />
      <div id="tutorial-schedules" tabIndex={-1} aria-label="Schedule browser" role="region">
        <ScheduleSwitcher />
      </div>
    </PlannerProvider>,
  );
}

it.each([null, "Ye Lu"])("reveals a planned lecture course's real Professor control and retains %s", async (name) => {
  start(async (id) => {
    const term = termFile(id);
    term.courses[1].sections[0].type = "lab";
    return term;
  });
  view();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await act(async () => {
    planner.getState().addCourse("AE 2320");
    planner.getState().addCourse("AE 2410");
    planner.getState().setPreferences({ startsAfter: 600 });
    planner.getState().lockSection("AE 2320", "AE 2320-CX01");
  });
  expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Find Professor for AE 2320" }));
  const professor = screen.getByRole("combobox", { name: "Lecture professor" });
  expect(professor).toHaveFocus();
  expect(professor).toHaveTextContent("Any professor");
  expect(planner.getState().courses).toEqual(["AE 2320", "AE 2410"]);
  expect(planner.getState().selectedCourse).toBe("AE 2320");
  if (name) {
    await user.click(professor);
    await user.click(screen.getByRole("option", { name }));
  }
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: "Skip tutorial" }));
  expect(planner.getState().professorByCourse["AE 2320"] ?? null).toBe(name);
  expect(planner.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01"] });
  expect(planner.getState().preferences.startsAfter).toBe(600);
});

it.each(["lab", "discussion", "unnamed lecture"])("omits an unavailable professor target for a course with %s and allows completion", async (kind) => {
  start(async (id) => {
    const term = termFile(id);
    const section = term.courses[1].sections[0];
    if (kind === "unnamed lecture") section.instructors = [];
    else section.type = kind as "lab" | "discussion";
    return term;
  });
  view();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  expect(screen.queryByRole("button", { name: /^Find Professor/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Finish tutorial" }));
  expect(planner.getState().courses).toEqual(["AE 2410"]);
  expect(planner.getState().professorByCourse).toEqual({});
});

it("points to the displayed course's actual sections as schedules and alternatives change", async () => {
  start();
  view();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  const guide = screen.getByRole("region", { name: "First plan tutorial" });
  await user.click(await within(guide).findByRole("button", { name: "Find Lecture CL01" }));
  expect(screen.getByRole("heading", { name: "Lecture CL01" })).toHaveFocus();
  await user.click(within(guide).getByRole("button", { name: "Find Lab CX01" }));
  expect(screen.getByRole("heading", { name: "Lab CX01" })).toHaveFocus();
  expect(within(guide).queryByRole("button", { name: /^Find Discussion/ })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Next schedule" }));
  expect(within(guide).queryByRole("button", { name: "Find Lab CX01" })).not.toBeInTheDocument();
  await user.click(within(guide).getByRole("button", { name: "Find Lab CX02" }));
  expect(screen.getByRole("heading", { name: "Lab CX02" })).toHaveFocus();
  await act(async () => planner.getState().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-CX01"]));
  await user.click(within(guide).getByRole("button", { name: "Find Lab CX01" }));
  expect(screen.getByRole("heading", { name: "Lab CX01" })).toHaveFocus();

  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.click(await within(guide).findByRole("button", { name: "Find Lecture C01" }));
  expect(screen.getByRole("heading", { name: "Lecture C01" })).toHaveFocus();
  expect(within(guide).queryByRole("button", { name: /^Find Lab/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Finish tutorial" }));
  expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
  expect(planner.getState().courses).toEqual(["AE 2320", "AE 2410"]);
});

it("waits for a valid loaded term before allowing course selection", async () => {
  let finishLoading!: (term: ReturnType<typeof termFile>) => void;
  start((id) => id === "2027-D" ? new Promise((resolve) => { finishLoading = resolve; }) : Promise.resolve(termFile(id)));
  view();
  const user = userEvent.setup();
  const heading = await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(heading).toHaveFocus());

  await user.selectOptions(screen.getByRole("combobox", { name: "Term" }), "2027-D");
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.getByText("Choose a term and wait for its courses to load.")).toBeVisible();

  await act(async () => finishLoading(termFile("2027-D")));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Add your courses" })).toHaveFocus();
});

it("offers availability after courses without requiring any preference changes", async () => {
  start();
  view();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Set availability if you want" })).toHaveFocus();
  const summary = screen.getByRole("group", { name: "Current availability" });
  expect(within(summary).getByText("Any time")).toBeVisible();
  expect(within(summary).getByText("None")).toBeVisible();
  expect(within(summary).getByText("Only open sections")).toBeVisible();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Browse your schedules" })).toHaveFocus();
  expect(planner.getState().preferences).toEqual({ startsAfter: 0, blocked: [], onlyOpen: true });
});

it("shows real availability and keeps edits when going back or skipping", async () => {
  start();
  view();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.selectOptions(screen.getByRole("combobox", { name: "Starts after" }), "600");
  await user.click(screen.getByRole("switch", { name: "Only open sections" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  const summary = screen.getByRole("group", { name: "Current availability" });
  expect(within(summary).getByText("10:00 AM")).toBeVisible();
  expect(within(summary).getByText("Open and full sections")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Find Starts after" }));
  expect(screen.getByRole("combobox", { name: "Starts after" })).toHaveFocus();
  await user.selectOptions(screen.getByRole("combobox", { name: "Starts after" }), "660");
  await user.click(screen.getByRole("button", { name: "Find Block a time" }));
  const block = screen.getByRole("button", { name: "Block a time" });
  expect(block).toHaveFocus();
  await user.keyboard("{Enter}");
  const dialog = screen.getByRole("dialog", { name: "Block a time" });
  await user.click(within(dialog).getByRole("checkbox", { name: "Tuesday" }));
  await user.click(within(dialog).getByRole("button", { name: "Block time" }));
  expect(within(summary).getByText("Tue 12 PM–1 PM")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Find Only open sections" }));
  expect(screen.getByRole("switch", { name: "Only open sections" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(within(screen.getByRole("group", { name: "Current availability" })).getByText("11:00 AM")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Skip tutorial" }));
  expect(screen.getByRole("combobox", { name: "Starts after" })).toHaveFocus();
  expect(planner.getState().preferences).toEqual({ startsAfter: 660, blocked: [{ day: "Tue", start: 720, end: 780 }], onlyOpen: false });
});

it("requires one real course and keeps it when going back and skipping", async () => {
  start();
  view();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.getByText("Add at least one course to continue.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Search courses" }));
  const search = screen.getByRole("searchbox", { name: "Search courses" });
  expect(search).toHaveFocus();
  await user.type(search, "AE 2410{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Set availability if you want" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Browse your schedules" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { name: "Add your courses" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Skip tutorial" }));
  expect(screen.queryByRole("region", { name: "First plan tutorial" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove AE 2410" })).toBeVisible();
  expect(planner.getState().termId).toBe("2027-C");
  expect(planner.getState().courses).toEqual(["AE 2410"]);
  expect(search).toHaveFocus();
});

it.each(["Skip tutorial", "Close tutorial"])("remembers %s across reloads and term changes", async (label) => {
  start();
  const storage = new MemoryStorage();
  const first = view(storage);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: label }));
  expect(screen.getByRole("combobox", { name: "Term" })).toHaveFocus();
  await user.selectOptions(screen.getByRole("combobox", { name: "Term" }), "2027-D");
  first.unmount();
  view(storage);
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Term" })).toHaveValue("2027-D"));
  expect(screen.queryByRole("region", { name: "First plan tutorial" })).not.toBeInTheDocument();
});

it("opens a returning student's restored plan without replaying the guide", async () => {
  const storage = start();
  writeDraft(storage, "2027-C", { ...emptyDraft(), courses: ["AE 2410"] });
  await act(async () => {
    view();
    await planner.getState().init();
  });
  expect(screen.getByRole("button", { name: "Remove AE 2410" })).toBeVisible();
  expect(screen.queryByRole("region", { name: "First plan tutorial" })).not.toBeInTheDocument();
});

it.each([null, {
  getItem: () => { throw new Error("Storage blocked"); },
  setItem: () => { throw new Error("Storage full"); },
}, {
  getItem: () => null,
  setItem: () => { throw new Error("Storage full"); },
}])("keeps the planner usable and warns when dismissal cannot be remembered", async (storage) => {
  start();
  view(storage);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Skip tutorial" }));
  expect(screen.getByRole("status")).toHaveTextContent("This browser couldn’t remember that you closed the guide. It may appear on your next visit.");
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  expect(screen.getByRole("button", { name: "Remove AE 2410" })).toBeVisible();
});

it("does not read tutorial storage during server rendering", () => {
  start();
  const storage = { getItem: vi.fn(), setItem: vi.fn() };
  expect(renderToString(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>)).toBe("");
  expect(storage.getItem).not.toHaveBeenCalled();
  expect(storage.setItem).not.toHaveBeenCalled();
});

it("remembers completion without relying on a restored course selection", async () => {
  start();
  const storage = new MemoryStorage();
  const first = view(storage);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Finish tutorial" }));
  expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Remove AE 2410" }));
  first.unmount();
  await act(async () => { view(storage); });
  expect(screen.queryByRole("region", { name: "First plan tutorial" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove AE 2410" })).not.toBeInTheDocument();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("completed");
});

it.each(["no matches", "incomplete search", "engine error", "worker error", "loading"])("finishes with %s and preserves the planner's result handling", async (outcome) => {
  start(undefined, async (request) => {
    if (outcome === "loading") return new Promise(() => {});
    if (outcome === "worker error") throw new Error("Worker unavailable");
    if (outcome === "engine error") return { ok: false, version: 1, error: { code: "internal", message: "Unavailable", detail: null } };
    return { ...solved(request), total: 0, patterns: 0, schedules: [], diagnosis: {
      unsure: outcome === "incomplete search", emptyCourses: [], clashingPairs: [], minimalClash: [], fixes: [],
    } };
  });
  view();
  render(<PlannerProvider store={planner}><ScheduleView /></PlannerProvider>);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  if (outcome === "no matches") expect(await screen.findByText("No schedule fits your current choices. Your restrictions are still in place. Use the explanation below and change a setting when you’re ready.")).toBeVisible();
  else expect(screen.queryByText(/^No schedule fits your current choices/)).not.toBeInTheDocument();
  const guide = within(screen.getByRole("region", { name: "First plan tutorial" }));
  expect(guide.queryByRole("button", { name: /^Find (Lecture|Lab|Discussion)/ })).not.toBeInTheDocument();
  expect(guide.getByText(/Then open Saved plans → Sections to register/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Finish tutorial" }));
  expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
  expect(screen.getByRole("button", { name: "Remove AE 2410" })).toBeVisible();
  if (outcome === "no matches") expect(await screen.findByText("0 schedules fit")).toBeVisible();
  if (outcome === "incomplete search") expect(await screen.findByText("Search incomplete")).toBeVisible();
  if (outcome.includes("error")) expect(await screen.findByRole("button", { name: "Retry" })).toBeVisible();
  if (outcome === "loading") expect(planner.getState().solveStatus).toBe("solving");
});
