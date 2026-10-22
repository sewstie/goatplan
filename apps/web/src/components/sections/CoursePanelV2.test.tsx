import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { startTestPlanner } from "./testing/plannerStore";

it("puts the lecture professor and its hint before the sections in this schedule", async () => {
  const { store } = await startTestPlanner({ courses: ["AE 2320"] });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const field = screen.getByRole("combobox", { name: "Lecture professor" });
  const hint = screen.getByText("Filters lectures only. Labs and discussions can have other instructors.");
  const sections = screen.getByRole("heading", { name: "Sections in this schedule" });
  expect(field.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(hint.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(field).toHaveAccessibleDescription(hint.textContent!);
  expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  expect(screen.queryByText("Compatible")).not.toBeInTheDocument();
});

it.each([undefined, {}, { rating: null }])("shows Rating unavailable for missing or null instructor ratings: %j", async (instructor) => {
  const term = { ...termFile("2027-C"), instructors: instructor ? { "Ye Lu": instructor } : undefined };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const row = within(screen.getByRole("group", { name: "Ye Lu" }));
  expect(row.getByText("— / 5")).toBeInTheDocument();
  expect(row.getByText("Rating unavailable")).toBeInTheDocument();
  expect(row.getByRole("link", { name: "Rate My Professors: Ye Lu (opens in a new tab)" })).toBeInTheDocument();
});

it("gives each co-teacher their own rating and review link without rating lab instructors", async () => {
  const term = { ...termFile("2027-C"), instructors: {
    "Ye Lu": { rating: { score: 4.4, count: 27 } },
    "Alex Smith": { rating: { score: 0, count: 0 } },
    "Mark Richman": { rating: null },
  } };
  term.courses[0].sections[0].instructors = ["Ye Lu", "Alex Smith", "Mark Richman", "Former Teacher"];
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const row = (name: string) => within(screen.getByRole("group", { name }));
  expect(row("Ye Lu").getByText("4.4 / 5")).toBeInTheDocument();
  expect(row("Alex Smith").getByText("0.0 / 5")).toBeInTheDocument();
  expect(row("Alex Smith").getByText("0 ratings")).toBeInTheDocument();
  expect(row("Mark Richman").getByText("Rating unavailable")).toBeInTheDocument();
  expect(row("Former Teacher").getByText("Rating unavailable")).toBeInTheDocument();
  for (const name of ["Ye Lu", "Alex Smith", "Mark Richman", "Former Teacher"]) {
    expect(row(name).getByRole("link", { name: `Rate My Professors: ${name} (opens in a new tab)` })).toBeInTheDocument();
  }
  expect(screen.getAllByRole("link", { name: /Rate My Professors/ })).toHaveLength(4);
});

it("keeps Your choices and the professor field below the cards for the waitlist state", async () => {
  const term = termFile("2027-C");
  Object.assign(term.courses[1].sections[0], { status: "waitlist", capacity: 50, enrolled: 50, waitlist: { taken: 7, capacity: 15 } });
  const { store } = await startTestPlanner({ courses: ["AE 2410"], preferences: { startsAfter: 0, blocked: [], onlyOpen: false } }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const choices = screen.getByRole("heading", { name: "Your choices" });
  const field = screen.getByRole("combobox", { name: "Lecture professor" });
  expect(choices.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("Waitlist only")).toBeInTheDocument();
  expect(screen.getByText("7 of 15 on waitlist")).toBeInTheDocument();
});

it("hides the lecture professor for a course without lectures and offers direct section choices", async () => {
  const term = termFile("2027-C");
  term.courses[0].sections[0].type = "lab";
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.getByText("This course has no lecture. Choose a lab section directly.")).toBeInTheDocument();
  expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  expect(screen.queryByText("Compatible")).not.toBeInTheDocument();
});

it("shows paired labs and discussions as compatible compact cards without instructor ratings", async () => {
  const term = termFile("2027-C");
  const course = term.courses[0];
  const discussion = { ...course.sections[1], id: "AE 2320-D01", code: "D01", type: "discussion" as const, instructors: ["Discussion Tutor"] };
  course.sections.push(discussion);
  course.options = course.options.map((option) => [...option, discussion.id]);
  const { store } = await startTestPlanner({ courses: [course.code] }, { term, solve: (request) => {
    const response = solved(request);
    if (response.ok) response.schedules[0].courses[0].sections.push(discussion.id);
    return response;
  } });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  for (const heading of ["Lab CX01", "Discussion D01"]) {
    const card = within(screen.getByRole("heading", { name: heading }).closest("article")!);
    expect(card.getByText("Compatible")).toBeInTheDocument();
    expect(card.getByText("Unity Hall 400").parentElement).toHaveTextContent(heading === "Lab CX01" ? "Unity Hall 400 · Ye Lu" : "Unity Hall 400 · Discussion Tutor");
    expect(card.queryByText(/\/ 5/)).not.toBeInTheDocument();
    expect(card.queryByRole("link")).not.toBeInTheDocument();
  }
  expect(screen.getAllByText("Compatible")).toHaveLength(2);
  expect(screen.getByText("Filters lectures only. Compatible labs and discussions can have other instructors.")).toBeInTheDocument();
});

it("marks the lecture professor as Optional only when more than one lecture instructor is available", async () => {
  const term = termFile("2027-C");
  term.courses[0].sections[0].instructors = ["Ye Lu", "Alex Smith"];
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  expect(screen.getByText("Optional")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Lecture professor" })).toHaveTextContent("Any professor");
});

it("shows a lecture instructor's score, count and review link before a professor is selected", async () => {
  const term = { ...termFile("2027-C"), instructors: { "Ye Lu": { rating: { score: 4.4, count: 27 } } } };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const lecture = within(screen.getByRole("heading", { name: "Lecture CL01" }).closest("article")!);
  expect(lecture.getByText("4.4 / 5")).toBeInTheDocument();
  expect(lecture.getByText("27 ratings")).toBeInTheDocument();
  const link = lecture.getByRole("link", { name: "Rate My Professors: Ye Lu (opens in a new tab)" });
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("href", "https://www.ratemyprofessors.com/search/professors/1220?q=Ye%20Lu");
  expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});
