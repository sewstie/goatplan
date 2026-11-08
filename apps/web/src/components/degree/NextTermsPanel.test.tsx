import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { DegreeSnapshot } from "@/lib/degree";
import type { Recommendation } from "@/lib/degree/recommendations/planner";
import { typedCourse } from "@/lib/degree/history";
import { NextTermsPanel } from "./NextTermsPanel";

const mocks = vi.hoisted(() => ({ generate: vi.fn(), load: vi.fn(), snapshot: vi.fn(), published: { status: "ready", terms: [{ id: "2027-C", year: 2027, start: "2027-01-13", end: "2027-03-05" }], retry: vi.fn() } }));
vi.mock("./useCourseCatalog", () => ({ useCourseCatalog: () => ({ ready: true, failed: false, courses: [], load: mocks.load }) }));
vi.mock("./usePublishedTerms", () => ({ usePublishedTerms: () => mocks.published }));
vi.mock("@/lib/degree/recommendations/planner", () => ({ recommend: mocks.generate }));
vi.mock("@/lib/degree/recommendations/audit", () => ({ createRecommendationAudit: () => ({}) }));
vi.mock("@/lib/engine", () => ({ getEngineClient: () => ({}) }));
vi.mock("@/lib/degree/degreeSource", () => ({ getDegreeSource: () => ({ getSnapshot: mocks.snapshot }) }));
vi.mock("./OpenInPlanner", () => ({ OpenInPlanner: () => <button>Open in planner</button> }));
const degree = { selectedSheetId: "cs-2030", history: { courses: [], manual: [] }, sheet: { id: "cs-2030" }, audit: { status: "ready" } } as unknown as DegreeSnapshot;
function preview(): Recommendation {
  return { terms: [{ term: { letter: "A", year: 2027 }, state: "open", existing: [], additions: [{ course: { ...typedCourse("CS 1101"), status: "planned", term: "A Term 2027" }, reason: "Fills an open Computer Science line on your sheet.", kept: false, background: { state: "completed", text: "No recommended background.", notes: [] }, offering: { state: "estimated", text: "Usually offered in A.", credits: 3 } }], alternatives: [{ course: { ...typedCourse("CS 2022"), status: "planned", term: "A Term 2027" }, reason: "Could fill Computer Science.", kept: false, background: { state: "completed", text: "No background listed.", notes: [] }, offering: { state: "estimated", text: "Usually offered in A term.", credits: 3 } }], issues: [], credits: 3, unused: 6 }], issues: [], limited: false };
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
  mocks.published.status = "ready";
  mocks.snapshot.mockReturnValue(degree);
  mocks.generate.mockResolvedValue(preview());
});
const mount = () => render(<NextTermsPanel degree={degree} startYear={2026} blocks={{}} onClose={() => {}} />);
const startButton = () => screen.getByRole("button", { name: /^Starting term/ });
function pickStart(name: string) {
  fireEvent.click(startButton());
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
}
const addButton = () => screen.getByRole("button", { name: /to my plan$/ });
async function generate() {
  pickStart("A Term 2027");
  fireEvent.click(screen.getByRole("button", { name: "Suggest courses" }));
  await screen.findByText("Suggestions ready. Nothing is saved until you add them.");
}
it("defaults to the published future C term before it begins", () => {
  mount();
  expect(startButton()).toHaveAccessibleName(/C Term 2027/);
});
it("updates a delayed published default and preserves a user term selection", () => {
  mocks.published.status = "loading";
  const view = mount();
  expect(screen.getByRole("status")).toHaveTextContent("Loading published terms");
  mocks.published.status = "ready";
  view.rerender(<NextTermsPanel degree={degree} startYear={2026} blocks={{}} onClose={() => {}} />);
  expect(startButton()).toHaveAccessibleName(/C Term 2027/);
  pickStart("A Term 2028");
  view.rerender(<NextTermsPanel degree={degree} startYear={2026} blocks={{}} onClose={() => {}} />);
  expect(startButton()).toHaveAccessibleName(/A Term 2028/);
});
it("toggles selection both ways, counts it in the footer, and never writes on generation or close", async () => {
  mount();
  await generate();
  const checkbox = screen.getByRole("checkbox", { name: "Add CS 1101" });
  expect(addButton()).toHaveTextContent("Add 1 course to my plan");
  fireEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
  expect(addButton()).toBeDisabled();
  expect(screen.getByText("0 selected")).toBeInTheDocument();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  expect(addButton()).toBeEnabled();
  expect(localStorage.length).toBe(0);
});
it("keeps an other option, shows it as kept, and marks the list out of date", async () => {
  mount();
  await generate();
  const keep = screen.getByRole("button", { name: "Keep CS 2022" });
  expect(keep).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(keep);
  expect(screen.getByRole("button", { name: "Keep CS 2022" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("list", { name: "Kept choices" })).toHaveTextContent("Kept CS 2022 · A Term 2027");
  expect(screen.getByRole("alert")).toHaveTextContent("out of date");
  fireEvent.click(screen.getByRole("button", { name: "Unkeep CS 2022" }));
  expect(screen.getByRole("button", { name: "Suggest again" })).toHaveFocus();
  expect(screen.queryByRole("list", { name: "Kept choices" })).not.toBeInTheDocument();
});
it("skipping a suggestion unticks it without making the list out of date", async () => {
  mount();
  await generate();
  fireEvent.click(screen.getByRole("button", { name: "Skip CS 1101" }));
  expect(screen.getByRole("checkbox", { name: "Add CS 1101" })).not.toBeChecked();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(addButton()).toHaveTextContent("Add courses to my plan");
  expect(addButton()).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Bring back CS 1101" }));
  expect(screen.getByRole("button", { name: "Suggest again" })).toHaveFocus();
});
it("refuses a starting term that has already begun", async () => {
  mount();
  pickStart("A Term 2026");
  fireEvent.click(screen.getByRole("button", { name: "Suggest courses" }));
  expect(await screen.findByText(/^Pick a term after/)).toBeInTheDocument();
  expect(mocks.generate).not.toHaveBeenCalled();
});
it("invalidates a preview when project reservations change in another tab", async () => {
  mount();
  await generate();
  act(() => {
    localStorage.setItem("goatplan:degree:projects", JSON.stringify({ "A Term 2027": "IQP" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "goatplan:degree:projects" }));
  });
  expect(screen.getByRole("alert")).toHaveTextContent("out of date");
  expect(addButton()).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Suggest again" }));
  await waitFor(() => expect(mocks.generate).toHaveBeenLastCalledWith(expect.objectContaining({ reserved: { "A Term 2027": "IQP" } }), expect.anything()));
});
it("turns courses per term into a credit limit", async () => {
  mount();
  fireEvent.click(within(screen.getByRole("group", { name: "Courses per term" })).getByRole("button", { name: "4" }));
  await generate();
  expect(mocks.generate).toHaveBeenLastCalledWith(expect.objectContaining({ cap: 12 }), expect.anything());
});
it("ignores a late generation response after settings change", async () => {
  let resolve!: (result: Recommendation) => void;
  mocks.generate.mockReturnValue(new Promise<Recommendation>((done) => { resolve = done; }));
  mount();
  pickStart("A Term 2027");
  fireEvent.click(screen.getByRole("button", { name: "Suggest courses" }));
  await waitFor(() => expect(mocks.generate).toHaveBeenCalled());
  fireEvent.click(within(screen.getByRole("group", { name: "Courses per term" })).getByRole("button", { name: "2" }));
  await act(async () => resolve(preview()));
  expect(screen.queryByRole("button", { name: /to my plan$/ })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("settings changed");
});
