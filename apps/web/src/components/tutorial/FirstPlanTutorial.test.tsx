import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useStore } from "zustand";
import { TermPicker } from "@/components/courses/TermPicker";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { ScheduleSwitcher } from "@/components/schedule/ScheduleSwitcher";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { emptyDraft, writeDraft, type DraftStorage } from "@/lib/store/draft";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import type { PlannerStore } from "@/lib/store/types";
import { FirstPlanTutorial } from "./FirstPlanTutorial";

let planner: ReturnType<typeof createPlannerStore>;

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  getPlannerStore: () => planner,
  usePlanner: <T,>(selector: (state: PlannerStore) => T) => useStore(planner, selector),
}));

afterEach(() => vi.restoreAllMocks());

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
    <>
      <FirstPlanTutorial storage={storage} />
      <TermPicker />
      <CourseSearchPanel />
      <div id="tutorial-schedules" tabIndex={-1} aria-label="Schedule browser" role="region">
        <ScheduleSwitcher />
      </div>
    </>,
  );
}

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
  expect(screen.getByRole("heading", { name: "Browse your schedules" })).toHaveFocus();
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
  expect(renderToString(<FirstPlanTutorial storage={storage} />)).toBe("");
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
  render(<ScheduleView />);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Choose your term" });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "AE 2410{Enter}");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Finish tutorial" }));
  expect(screen.getByRole("region", { name: "Schedule browser" })).toHaveFocus();
  expect(screen.getByRole("button", { name: "Remove AE 2410" })).toBeVisible();
  if (outcome === "no matches") expect(await screen.findByText("0 schedules fit")).toBeVisible();
  if (outcome === "incomplete search") expect(await screen.findByText("Search incomplete")).toBeVisible();
  if (outcome.includes("error")) expect(await screen.findByRole("button", { name: "Retry" })).toBeVisible();
  if (outcome === "loading") expect(planner.getState().solveStatus).toBe("solving");
});
