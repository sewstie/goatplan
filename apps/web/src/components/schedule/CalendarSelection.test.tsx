import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { termFile } from "@/lib/store/testing/fixtures";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { startTestPlanner } from "@/components/sections/testing/plannerStore";
import { ScheduleView } from "./ScheduleView";

it("shows course details and professor links only after activating a calendar block", async () => {
  const term = termFile("2027-C");
  term.courses.find((course) => course.code === "AE 2410")!.sections[0].instructors = ["Mark Richman"];
  term.instructors = { "Mark Richman": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
  const { store } = await startTestPlanner({ courses: ["AE 2320", "AE 2410"] }, { term });
  render(<PlannerProvider store={store}><ScheduleView /><CourseDetailsPanel /></PlannerProvider>);
  const user = userEvent.setup();
  const block = screen.getByRole("button", { name: /^AE 2410 C01, .*Monday/ });

  await user.hover(block);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();
  await user.unhover(block);
  act(() => block.focus());
  expect(block).toHaveFocus();
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();

  await user.keyboard("{Enter}");
  expect(screen.getByRole("heading", { level: 2, name: "AE 2410" })).toBeInTheDocument();
  const professor = within(screen.getByRole("group", { name: "Mark Richman" }));
  expect(professor.getByRole("link", { name: "View Mark Richman in OSCAR (opens in a new tab)" })).toBeInTheDocument();
  expect(professor.queryByText(/\/ 5|ratings|Example data/)).not.toBeInTheDocument();
  expect(block).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
