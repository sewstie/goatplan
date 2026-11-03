import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { TermPicker } from "@/components/courses/TermPicker";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { ScheduleSwitcher } from "@/components/schedule/ScheduleSwitcher";
import { PlannerProvider } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { PlannerToast } from "@/components/shell/PlannerToast";
import { FirstPlanTutorial } from "./FirstPlanTutorial";
import { useGuideSession } from "./guideSession";
import { ReplayGuideButton } from "./ReplayGuideButton";
import { draftKey, emptyDraft } from "@/lib/store/draft";
import { designPlan } from "@/lib/plans/testing";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));

beforeAll(() => { vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} }); });
beforeEach(() => { useGuideSession.setState({ replayRequested: false, skipped: false, closedThisVisit: false }); });

/** AE 2320 with a second lecture professor, so the guide has a Lecture professor choice to point at. */
function twoProfessorTerm(id: string) {
  const term = termFile(id);
  const [lecture] = term.courses[0].sections;
  term.courses[0].sections.push({ ...lecture, id: "AE 2320-CL02", code: "CL02", instructors: ["Alex Rivera"] });
  term.courses[0].options.push(["AE 2320-CL02", "AE 2320-CX01"]);
  return term;
}

function start(loadTerm = async (id: string) => twoProfessorTerm(id), solve: (request: SolveRequest) => Promise<SolveResponse> = async (request) => solved(request), storage = new MemoryStorage()) {
  const planner = createPlannerStore({
    engine: { loadTerm: async (id) => loaded(id), solve },
    loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }),
    loadTerm, takeTermBuffer: () => null, storage, solveDelayMs: 0,
    now: () => new Date("2026-10-21T12:00:00Z"),
  });
  const view = render(<PlannerProvider store={planner}>
    <FirstPlanTutorial storage={storage} />
    <ReplayGuideButton />
    <TermPicker /><CourseSearchPanel /><PreferencesBar /><CourseDetailsPanel />
    <div id="tutorial-schedules" tabIndex={-1} role="region" aria-label="Schedule browser"><ScheduleSwitcher /></div>
  </PlannerProvider>);
  return { planner, storage, ...view };
}

it("opens beside the term while it loads and keeps waiting Next focusable with a reason", async () => {
  let finish!: (term: ReturnType<typeof termFile>) => void;
  start(() => new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  const dialog = await screen.findByRole("dialog", { name: "Choose your term" });
  expect(dialog).toHaveAccessibleDescription("Everything you add belongs to this term. Once its sections load, you can start choosing courses.");
  expect(screen.getByRole("heading", { name: "Choose your term" })).toHaveFocus();
  const next = screen.getByRole("button", { name: "Next" });
  expect(next).toHaveAttribute("aria-disabled", "true");
  expect(next).not.toBeDisabled();
  expect(next).toHaveAccessibleDescription("Wait for 2027-C sections to load.");
  await user.click(next);
  expect(screen.getByRole("heading", { name: "Choose your term" })).toBeVisible();
  await act(async () => finish(termFile("2027-C")));
  await waitFor(() => expect(next).toHaveAttribute("aria-disabled", "false"));
  await user.click(next);
  expect(screen.getByRole("heading", { name: "Add the courses you need" })).toHaveFocus();
  expect(next).toHaveAttribute("aria-disabled", "true");
});

it("keeps the first-visit guide closed while opening a shared link", async () => {
  const originalUrl = window.location.href;
  window.history.replaceState(null, "", "/#p=broken");
  try {
    start();
    await act(async () => {});
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Getting started/)).not.toBeInTheDocument();
  } finally {
    window.history.replaceState(null, "", originalUrl);
  }
});

it("moves focus through all five steps without changing the plan and finishes without saving", async () => {
  const { planner, storage, unmount } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  await act(async () => {
    planner.getState().setPreferences({ startsAfter: 540, blocked: [{ day: "Mon", start: 720, end: 780, label: "Lunch" }, { day: "Wed", start: 720, end: 780, label: "Lunch" }, { day: "Fri", start: 720, end: 780, label: "Lunch" }] });
    planner.getState().lockSection("AE 2320", "AE 2320-CX02");
    planner.getState().setProfessor("AE 2320", "Ye Lu");
  });
  const before = plan(planner);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "A professor preference is optional" })).toHaveFocus();
  expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Want a specific professor? Pick them here to see only their lectures. Any professor keeps every option.");
  expect(document.querySelector('[data-guide-target]')).toBe(screen.getByRole("combobox", { name: "Lecture professor" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Make room for your day" })).toHaveFocus();
  expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Press Block a time, then drag on the calendar to mark when you’re busy. Drag on a blocked time to erase it.");
  expect(document.querySelector("[data-guide-target]")).toBe(screen.getByRole("button", { name: "Block a time" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("button", { name: "Finish guide" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { name: "Make room for your day" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Finish guide" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
  expect(plan(planner)).toEqual(before);
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("completed");
  unmount();
});

function plan(planner: ReturnType<typeof createPlannerStore>) {
  const { courses, preferences, locks, professorByCourse, alternatives, sortPreset } = planner.getState();
  return structuredClone({ courses, preferences, locks, professorByCourse, alternatives, sortPreset });
}

it.each(["zero", "pending", "error", "matches"])("always allows finishing with %s and shows no-match copy only for a zero result", async (outcome) => {
  const { planner } = start(undefined, async (request) => {
    if (outcome === "pending") return new Promise(() => {});
    if (outcome === "error") throw new Error("Worker unavailable");
    return outcome === "zero" ? { ...solved(request), total: 0, patterns: 0, schedules: [] } : solved(request);
  });
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Next" }));
  if (outcome === "zero") {
    expect(await screen.findByRole("heading", { name: "You can finish with no matches" })).toBeVisible();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Nothing fits right now. The panel shows why and offers fixes — finish the guide and pick one when you’re ready.");
  }
  else expect(screen.getByRole("heading", { name: "Browse, inspect, then save if you like" })).toBeVisible();
  const before = plan(planner);
  expect(screen.getByRole("button", { name: "Finish guide" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Finish guide" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(plan(planner)).toEqual(before);
});

it("keeps progress stable when lectures disappear until the next navigation", async () => {
  const { planner } = start(async (id) => {
    const term = termFile(id);
    term.courses[1].sections[0].type = "lab";
    return term;
  });
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  expect(screen.getByText("Getting started · 2 of 5")).toHaveAttribute("aria-live", "polite");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Make room for your day" })).toHaveFocus();
  expect(screen.getByText("Getting started · 3 of 4")).toBeVisible();
  await act(async () => planner.getState().removeCourse("AE 2410"));
  expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false");
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { name: "Add the courses you need" })).toHaveFocus();
});

it("remembers Skip guide without changing the plan and hides the guide on return", async () => {
  const { planner, storage, unmount } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  const before = plan(planner);
  await user.click(screen.getByRole("button", { name: "Skip guide" }));
  expect(plan(planner)).toEqual(before);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("dismissed");
  unmount();
  render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  await act(async () => {});
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it.each(["Close guide", "Escape"])("%s closes the guide for this visit only", async (action) => {
  const { planner, storage, unmount } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  const before = plan(planner);
  if (action === "Escape") await user.keyboard("{Escape}");
  else await user.click(screen.getByRole("button", { name: action }));
  expect(plan(planner)).toEqual(before);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("started");
  unmount();
  // Back within the same visit, as after a trip to /plans.
  const again = render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  await act(async () => {});
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  again.unmount();
  // The next page load.
  useGuideSession.setState({ closedThisVisit: false });
  render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  expect(await screen.findByRole("heading", { name: "Choose your term" })).toBeVisible();
});

it.each(["Close guide", "Escape"])("%s after adding a course brings the guide back on the next visit", async (action) => {
  const { planner, storage, unmount } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  if (action === "Escape") await user.keyboard("{Escape}");
  else await user.click(screen.getByRole("button", { name: action }));
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("started");
  unmount();
  const again = render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  await act(async () => {});
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("started");
  again.unmount();
  useGuideSession.setState({ closedThisVisit: false });
  render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  expect(await screen.findByRole("heading", { name: "Choose your term" })).toBeVisible();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("started");
});

it("leaves the guide open when Escape closes a dialog on top of it", async () => {
  start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  const dialog = document.body.appendChild(document.createElement("dialog"));
  dialog.setAttribute("open", "");
  await user.keyboard("{Escape}");
  expect(screen.getByRole("heading", { name: "Choose your term" })).toBeVisible();
  dialog.remove();
});

it("drops the Skip note when another toast takes over, so it can't come back later", async () => {
  const { planner } = start();
  render(<PlannerProvider store={planner}><PlannerToast /></PlannerProvider>);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  await user.click(screen.getByRole("button", { name: "Skip guide" }));
  expect(screen.getByText("Guide closed · Replay it from How to use")).toBeVisible();
  await act(async () => planner.getState().removeCourse("AE 2320"));
  expect(screen.getByText("Removed AE 2320")).toBeVisible();
  await act(async () => planner.getState().dismissRemovedCourse());
  expect(screen.queryByText("Guide closed · Replay it from How to use")).not.toBeInTheDocument();
});

it("notes where to replay the guide after Skip, and not after Close", async () => {
  const { planner, storage } = start();
  render(<PlannerProvider store={planner}><PlannerToast /></PlannerProvider>);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Close guide" }));
  expect(screen.queryByText("Guide closed · Replay it from How to use")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "How to use GoatPlan" }));
  await user.click(await screen.findByRole("button", { name: "Skip guide" }));
  expect(screen.getByText("Guide closed · Replay it from How to use")).toBeVisible();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("dismissed");
  await user.click(screen.getByRole("button", { name: "How to use GoatPlan" }));
  await screen.findByRole("dialog");
  expect(screen.queryByText("Guide closed · Replay it from How to use")).not.toBeInTheDocument();
});

it("replays from step 1 without changing the plan, and closing the replay keeps the guide done", async () => {
  const { planner, storage } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Finish guide" }));
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("completed");
  const before = plan(planner);
  await user.click(screen.getByRole("button", { name: "How to use GoatPlan" }));
  expect(await screen.findByRole("heading", { name: "Choose your term" })).toHaveFocus();
  expect(screen.getByText("Getting started · 1 of 5")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Great — press Next")).toBeVisible();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("completed");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("completed");
  expect(plan(planner)).toEqual(before);
});

it("restarts at step 1 when replay is pressed with the guide already open", async () => {
  start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "How to use GoatPlan" }));
  expect(await screen.findByRole("heading", { name: "Choose your term" })).toHaveFocus();
});

it("leaves a saved plan's view to replay the guide", async () => {
  const { planner, storage } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await act(async () => planner.setState({ savedPlanId: "saved-plan" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "How to use GoatPlan" }));
  expect(await screen.findByRole("heading", { name: "Choose your term" })).toBeVisible();
  expect(planner.getState().savedPlanId).toBeNull();
  expect(storage.getItem("goatplan:tutorial:v1")).toBeNull();
});

it("keeps Finish guide on record when a replay is skipped", async () => {
  const storage = new MemoryStorage();
  storage.setItem("goatplan:tutorial:v1", "completed");
  start(undefined, undefined, storage);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "How to use GoatPlan" }));
  await user.click(await screen.findByRole("button", { name: "Skip guide" }));
  expect(storage.getItem("goatplan:tutorial:v1")).toBe("completed");
});

it("swaps the step 2 hint once a course is added", async () => {
  start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Add at least one course to continue.")).toBeVisible();
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  expect(screen.getByText("Great — press Next")).toBeVisible();
  expect(screen.queryByText("Add at least one course to continue.")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).not.toHaveAccessibleDescription();
});

it("lets Escape leave drawing mode first, keeps the guide open, and ends drawing on Next", async () => {
  const { planner } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  for (let i = 0; i < 2; i++) await user.click(screen.getByRole("button", { name: "Next" }));
  await act(async () => planner.getState().setDrawing(true));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("heading", { name: "Make room for your day" })).toBeVisible();
  await act(async () => planner.getState().setDrawing(true));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(planner.getState().drawing).toBe(false);
});

it("says once, on the last step, that the plan is kept in this browser", async () => {
  start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  expect(screen.queryByText("Your plan is saved in this browser.")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  for (let i = 0; i < 2; i++) {
    expect(screen.queryByText("Your plan is saved in this browser.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
  }
  expect(screen.queryByText("Your plan is saved in this browser.")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Your plan is saved in this browser.")).toBeVisible();
  expect(screen.queryByText("Your choices stay in your plan.")).not.toBeInTheDocument();
});

it("leaves the guide open when Escape only backs out of the search results", async () => {
  start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  const search = await screen.findByRole("searchbox", { name: "Search courses" });
  await waitFor(() => expect(search).toBeEnabled());
  await user.type(search, "ae 2");
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("button", { name: "Add AE 2320" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(search).toHaveFocus();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("never targets Saved controls and restores guide focus on returning to Found", async () => {
  const { planner } = start();
  await screen.findByRole("heading", { name: "Choose your term" });
  await act(async () => planner.setState({ savedPlanId: "saved-plan" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.querySelector('[data-guide-target]')).toBeNull();
  await act(async () => planner.getState().showFound());
  expect(screen.getByRole("heading", { name: "Choose your term" })).toHaveFocus();
});

it("skips the professor step when a course has no professor to choose", async () => {
  start(async (id) => {
    const term = termFile(id);
    term.courses[1].sections[0].instructors = [];
    return term;
  });
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Make room for your day" })).toHaveFocus();
  expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
});

it("keeps focus on real controls when the selected course changes during the final step", async () => {
  const { planner } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Next" }));
  const course = screen.getByRole("button", { name: /^AE 2320/ });
  await user.click(course);
  expect(planner.getState().selectedCourse).toBe("AE 2320");
  expect(course).toHaveFocus();
});

it.each(["Skip guide", "Close guide", "Escape"])("keeps an edited plan when %s is used at availability", async (action) => {
  const { planner } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  await act(async () => {
    planner.getState().setPreferences({ startsAfter: 600, onlyOpen: false });
    planner.getState().lockSection("AE 2320", "AE 2320-CX02");
    planner.getState().setProfessor("AE 2320", "Ye Lu");
  });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  const before = plan(planner);
  if (action === "Escape") await user.keyboard("{Escape}");
  else await user.click(screen.getByRole("button", { name: action }));
  expect(plan(planner)).toEqual(before);
});

it("keeps a stored dismissal hidden while the term loads", async () => {
  const storage = new MemoryStorage();
  storage.setItem("goatplan:tutorial:v1", "dismissed");
  const { planner, unmount } = start();
  unmount();
  render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  await act(async () => { await planner.getState().init(); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("warns if the browser cannot remember dismissal and leaves the planner usable", async () => {
  const { planner, unmount } = start();
  unmount();
  render(<PlannerProvider store={planner}><FirstPlanTutorial storage={null} /><TermPicker /></PlannerProvider>);
  const user = userEvent.setup();
  await screen.findByRole("dialog");
  await user.click(screen.getByRole("button", { name: "Skip guide" }));
  expect(screen.getByRole("status")).toHaveTextContent("Guide progress can’t be remembered in this browser. You may see the guide again next visit.");
  expect(screen.getByRole("combobox", { name: "Term" })).toBeEnabled();
});

it("opens a restored plan without the guide or a restored-plan status", async () => {
  const { planner, storage, unmount } = start();
  unmount();
  storage.setItem(draftKey("2027-C"), JSON.stringify({ version: 1, ...emptyDraft(), courses: ["AE 2320"], preferences: { startsAfter: 540, blocked: [], onlyOpen: true } }));
  await act(async () => { await planner.getState().init(); await planner.getState().setTerm("2027-C"); });
  render(<PlannerProvider store={planner}><FirstPlanTutorial storage={storage} /></PlannerProvider>);
  await act(async () => {});
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("changes only the open step once after a storage write fails and keeps planning usable", async () => {
  const { planner, storage } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  vi.spyOn(storage, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
  const before = plan(planner);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Keep planning in this visit" })).toBeVisible();
  expect(screen.getByRole("dialog")).toHaveAccessibleDescription("You can continue or skip the guide. Your course and choices stay in the open plan.");
  const banner = screen.getByText("Guide progress can’t be remembered in this browser. You may see the guide again next visit.").closest('[role="status"]')!;
  expect(banner).toBeVisible();
  expect(banner.querySelector("svg")?.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(plan(planner)).toEqual(before);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Make room for your day" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { name: "A professor preference is optional" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Skip guide" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(banner).toBeVisible();
  await act(async () => planner.getState().setPreferences({ startsAfter: 600 }));
  expect(planner.getState().preferences.startsAfter).toBe(600);
  expect(banner).toBeVisible();
});

it("opens a saved snapshot without the guide or a restored-plan status", async () => {
  const { planner } = start();
  await screen.findByRole("heading", { name: "Choose your term" });
  await act(async () => {
    await planner.getState().init();
    planner.getState().setSavedPlans([designPlan({ professorByCourse: { "AE 2320": "Ye Lu" } })]);
    planner.getState().showSaved("plan-1");
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("keeps the guide hidden while a returning draft loads, even without a tutorial flag", async () => {
  const storage = new MemoryStorage();
  storage.setItem("goatplan:term:v1", "2027-C");
  storage.setItem(draftKey("2027-C"), JSON.stringify({ version: 1, ...emptyDraft(), courses: ["AE 2320"] }));
  let release!: (term: ReturnType<typeof termFile>) => void;
  start(() => new Promise((resolve) => { release = resolve; }), undefined, storage);
  await act(async () => {});
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await act(async () => release(termFile("2027-C")));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText(/Plan restored/)).not.toBeInTheDocument();
});

it("shows the storage wording once if the first failed write is Finish guide", async () => {
  const { storage } = start();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2320{Enter}");
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Next" }));
  vi.spyOn(storage, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
  await user.click(screen.getByRole("button", { name: "Finish guide" }));
  expect(screen.getByRole("heading", { name: "Keep planning in this visit" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Finish guide" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByText("Guide progress can’t be remembered in this browser. You may see the guide again next visit.")).toBeVisible();
});
