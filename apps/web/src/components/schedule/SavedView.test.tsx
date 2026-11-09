import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { buildSharedPlan } from "@/lib/share/buildSharedPlan";
import { plan as sharedPlan } from "@/lib/share/testing";
import { getPlannerStore } from "@/lib/store";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { PhonePreferenceChips } from "@/components/phone/PhonePreferenceChips";
import { PlannerBarActions } from "@/components/shell/PlannerBarActions";
import { PhoneScheduleScreen } from "@/components/phone/PhoneScheduleScreen";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { SortSelect } from "@/components/preferences/SortSelect";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { ScheduleView } from "./ScheduleView";
import { ScheduleSummary } from "./ScheduleSummary";
import { resetPlanner, setPlanner, term } from "./testing/plannerFixtures";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));

afterEach(resetPlanner);

it("keeps global phone menu actions keyboard accessible in a shared preview", async () => {
  const user = userEvent.setup();
  setPlanner({ courses: [], temporaryPlan: buildSharedPlan(sharedPlan, term), response: null, solveStatus: "idle" });
  render(<PhoneScheduleScreen banner={null} menuActions={<button type="button">Appearance</button>} />);
  const trigger = screen.getByRole("button", { name: "More actions" });
  trigger.focus();
  await user.keyboard("{Enter}{Tab}");
  expect(screen.getByRole("button", { name: "Appearance" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Saved plans" })).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

it("hides Add to degree in a shared preview when another draft is still loaded", () => {
  setPlanner({ courses: ["AE 5131"], temporaryPlan: buildSharedPlan(sharedPlan, term), response: null, solveStatus: "idle" });
  render(<PlannerBarActions />);
  expect(screen.queryByRole("button", { name: "Add to degree" })).not.toBeInTheDocument();
  expect(getPlannerStore().getState().courses).toEqual(["AE 5131"]);
});

it.each([{ courses: [] }, { courses: ["AE 5131"] }])("shows shared sections independently of the viewer's draft $courses", ({ courses }) => {
  const temporaryPlan = buildSharedPlan(sharedPlan, term);
  setPlanner({ courses, temporaryPlan, response: null, solveStatus: "idle" });
  render(<><ScheduleSummary /><PhonePreferenceChips /><SortSelect /><ScheduleView /></>);
  expect(screen.getAllByRole("button", { name: /^AE 2320 CL01,/ })).toHaveLength(5);
  expect(screen.getAllByRole("button", { name: /^AE 2410 C01,/ })).toHaveLength(5);
  expect(screen.getByRole("button", { name: /^AE 2320 CX02,.*locked$/ })).toBeInTheDocument();
  expect(screen.getByText("2 courses · Shared plan")).toBeInTheDocument();
  expect(screen.getAllByText("Most days off")).toHaveLength(2);
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.getByRole("switch", { name: "Only open sections" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: /Block time/ })).not.toBeInTheDocument();
  expect(getPlannerStore().getState().courses).toEqual(courses);
});

it("keeps lecture ratings before lab details even when the snapshot lists the lab first", () => {
  const plan = designPlan();
  setPlanner({ savedPlans: [plan], savedPlanId: plan.id, savedSelectedCourse: "AE 2320" });
  render(<CourseDetailsPanel />);
  const sections = screen.getByRole("region", { name: "Sections in this schedule" });
  expect(within(sections).getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual(["Lecture CL01", "Lab CX02"]);
});

it("shows saved sections, ratings, and preferences with no planner edit controls", () => {
  const plan = designPlan({ courses: ["AE 2210"], preferences: { startsAfter: 0, blocked: [{ day: "Sun", start: 1080, end: 1200, label: "Job" }], onlyOpen: false } });
  plan.schedule = [plan.schedule[2]];
  setPlanner({ savedPlans: [plan], savedPlanId: plan.id, savedSelectedCourse: "AE 2210", response: null, solveStatus: "error" });
  render(<><CourseSearchPanel /><PreferencesBar /><ScheduleView /><CourseDetailsPanel /></>);
  expect(screen.getByRole("region", { name: "Your courses" })).toHaveTextContent("AE 2210");
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "AE 2210" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /View David Olinger on Rate My Professors/ })).toBeInTheDocument();
  const preferences = screen.getByRole("group", { name: "Preferences" });
  expect(preferences).toHaveTextContent("Any time");
  expect(preferences).toHaveTextContent("Job");
  expect(within(preferences).getByRole("switch")).toBeDisabled();
  expect(screen.queryByRole("button", { name: /^(Remove |Lock |Unlock |Block a time)/ })).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /AE 2210 C01/ })).toHaveLength(5);
  expect(screen.queryByText("No matching timetable")).not.toBeInTheDocument();
});
