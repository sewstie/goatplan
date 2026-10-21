import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { termFile } from "@/lib/store/testing/fixtures";
import { startTestPlanner } from "@/components/sections/testing/plannerStore";
import { ScheduleView } from "./ScheduleView";

it("shows the lecture instructor's rating in hover details without changing the block face", async () => {
  const term = termFile("2027-C");
  term.instructors = { "Ye Lu": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><ScheduleView /></PlannerProvider>);
  const user = userEvent.setup();
  const block = screen.getByRole("button", { name: /^AE 2320 CL01, .*Monday/ });

  await user.hover(block);

  const tooltip = within(screen.getByRole("tooltip", { hidden: true }));
  expect(tooltip.getByText("4.4 / 5")).toBeInTheDocument();
  expect(tooltip.getByText("27 ratings · Example data")).toBeInTheDocument();
  expect(block).not.toHaveTextContent(/\/ 5|ratings/);
});

it("exposes the same rating details to keyboard and screen reader users and closes on Escape", async () => {
  const term = termFile("2027-C");
  term.instructors = { "Ye Lu": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><ScheduleView /></PlannerProvider>);
  const user = userEvent.setup();

  await user.tab();
  await user.tab();

  const block = screen.getByRole("button", { name: /^AE 2320 CL01, .*Monday/ });
  expect(block).toHaveFocus();
  const tooltip = screen.getByRole("tooltip");
  const instructor = within(tooltip).getByRole("group");
  expect(instructor).toHaveTextContent("4.4 / 5");
  expect(block).toHaveAccessibleDescription(/4\.4 \/ 5.*27 ratings/);
  expect(within(tooltip).queryByRole("link")).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(block).not.toHaveAttribute("aria-describedby");
});

it("keeps instructor ratings out of lab details even when that instructor has a rating", async () => {
  const term = termFile("2027-C");
  term.instructors = { "Ye Lu": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><ScheduleView /></PlannerProvider>);

  await userEvent.hover(screen.getByRole("button", { name: /^AE 2320 CX01,/ }));

  const tooltip = screen.getByRole("tooltip");
  expect(tooltip).toHaveTextContent("Ye Lu");
  expect(tooltip).not.toHaveTextContent(/\/ 5|ratings|Rating unavailable/);
});

it.each([undefined, {}, { rating: null }])("shows unavailable lecture ratings for missing data: %j", async (instructor) => {
  const term = termFile("2027-C");
  term.instructors = instructor ? { "Ye Lu": instructor } : undefined;
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><ScheduleView /></PlannerProvider>);

  await userEvent.hover(screen.getByRole("button", { name: /^AE 2320 CL01, .*Monday/ }));

  const tooltip = within(screen.getByRole("tooltip"));
  expect(tooltip.getByText("— / 5")).toBeInTheDocument();
  expect(tooltip.getByText("Rating unavailable")).toBeInTheDocument();
});

it("gives each co-teacher their own rating row", async () => {
  const term = termFile("2027-C");
  term.courses[0].sections[0].instructors = ["Ye Lu", "Alex Smith", "Mark Richman"];
  term.instructors = {
    "Ye Lu": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" },
    "Alex Smith": { rating: { score: 3, count: 1 }, ratingSource: "Example data" },
  };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><ScheduleView /></PlannerProvider>);

  await userEvent.hover(screen.getByRole("button", { name: /^AE 2320 CL01, .*Monday/ }));

  const tooltip = within(screen.getByRole("tooltip"));
  const rows = tooltip.getAllByRole("group");
  const row = (name: string) => within(rows.find((row) => within(row).queryByText(name))!);
  expect(rows).toHaveLength(3);
  expect(row("Ye Lu").getByText("4.4 / 5")).toBeInTheDocument();
  expect(row("Ye Lu").getByText("27 ratings · Example data")).toBeInTheDocument();
  expect(row("Alex Smith").getByText("3.0 / 5")).toBeInTheDocument();
  expect(row("Alex Smith").getByText("1 rating · Example data")).toBeInTheDocument();
  expect(row("Mark Richman").getByText("Rating unavailable")).toBeInTheDocument();
});

it("keeps ratings out of discussion and blocked time details", async () => {
  const term = termFile("2027-C");
  term.courses[0].sections[1].type = "discussion";
  term.instructors = { "Ye Lu": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } };
  const { store } = await startTestPlanner({ courses: ["AE 2320"], preferences: {
    startsAfter: 0, blocked: [{ day: "Tue", start: 840, end: 960, label: "Work" }], onlyOpen: true,
  } }, { term });
  render(<PlannerProvider store={store}><ScheduleView /></PlannerProvider>);
  const user = userEvent.setup();
  const discussion = screen.getByRole("button", { name: /^AE 2320 CX01,/ });

  await user.hover(discussion);
  expect(screen.getByRole("tooltip")).not.toHaveTextContent(/\/ 5|ratings|Rating unavailable/);
  await user.unhover(discussion);
  await user.hover(screen.getByText("Work"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
