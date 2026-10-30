import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { ScheduleView } from "./ScheduleView";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";

afterEach(resetPlanner);

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
