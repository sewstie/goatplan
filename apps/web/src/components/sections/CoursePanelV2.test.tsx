import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { startTestPlanner } from "./testing/plannerStore";

/** Gives a course a second lecture taught by someone else, so there is a professor to choose. */
function addSecondProfessor(course: ReturnType<typeof termFile>["courses"][number]) {
  const lecture = course.sections.find((section) => section.type === "lecture")!;
  course.sections.push({ ...lecture, id: `${course.code}-L02`, code: "L02", instructors: ["Alex Rivera"] });
  course.options.push(course.options[0].map((id) => (id === lecture.id ? `${course.code}-L02` : id)));
}

it("puts the lecture professor, with no hint under it, before the sections in this schedule", async () => {
  const term = termFile("2027-C");
  addSecondProfessor(term.courses[0]);
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const field = screen.getByRole("combobox", { name: "Lecture professor" });
  const sections = screen.getByRole("heading", { name: "Sections in this schedule" });
  expect(field.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.queryByText(/Filters lectures only/)).not.toBeInTheDocument();
  expect(field).not.toHaveAccessibleDescription();
  expect(screen.getByText("Optional")).toBeInTheDocument();
  expect(screen.queryByText("Compatible")).not.toBeInTheDocument();
});

it("hides the lecture professor when every lecture has the same professor", async () => {
  const { store } = await startTestPlanner({ courses: ["AE 2320"] });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  expect(screen.getByRole("heading", { name: "Sections in this schedule" })).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
  expect(screen.queryByText(/Filters lectures only/)).not.toBeInTheDocument();
});

it("shows no star score or rating text, only OSCAR and Rate My Professors links", async () => {
  const term = { ...termFile("2027-C"), instructors: { "Ye Lu": { rating: { score: 4.4, count: 27 }, ratingSource: "Example data" } } };
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const row = within(screen.getByRole("group", { name: "Ye Lu" }));
  expect(row.queryByText(/\/ 5|ratings?\b|Rating unavailable|Example data/)).not.toBeInTheDocument();
  expect(row.getByRole("link", { name: "View Ye Lu in OSCAR (opens in a new tab)" })).toHaveAttribute("href", "https://oscar.wpi.edu");
  expect(row.getByRole("link", { name: "View Ye Lu on Rate My Professors (opens in a new tab)" })).toBeInTheDocument();
});

it("gives each co-teacher their own links without listing lab instructors", async () => {
  const term = termFile("2027-C");
  term.courses[0].sections[0].instructors = ["Ye Lu", "Alex Smith", "Mark Richman", "Former Teacher"];
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const row = (name: string) => within(screen.getByRole("group", { name }));
  for (const name of ["Ye Lu", "Alex Smith", "Mark Richman", "Former Teacher"]) {
    expect(row(name).getByRole("link", { name: `View ${name} in OSCAR (opens in a new tab)` })).toBeInTheDocument();
    expect(row(name).getByRole("link", { name: `View ${name} on Rate My Professors (opens in a new tab)` })).toBeInTheDocument();
  }
  expect(screen.getAllByRole("link", { name: /in OSCAR/ })).toHaveLength(4);
  expect(screen.getAllByRole("link", { name: /Rate My Professors/ })).toHaveLength(4);
});

it("keeps Your choices and the professor field below the cards for the waitlist state", async () => {
  const term = termFile("2027-C");
  Object.assign(term.courses[1].sections[0], { status: "waitlist", capacity: 50, enrolled: 50, waitlist: { taken: 7, capacity: 15 } });
  addSecondProfessor(term.courses[1]);
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

it("lets a lab be locked in a course with labs and discussions, and shows neither instructor", async () => {
  const term = termFile("2027-C");
  const course = term.courses[0];
  const discussion = { ...course.sections[1], id: "AE 2320-D01", code: "D01", type: "discussion" as const, instructors: ["Discussion Tutor"] };
  course.sections.push(discussion);
  course.options = course.options.map((option) => [...option, discussion.id]);
  addSecondProfessor(course);
  const { store } = await startTestPlanner({ courses: [course.code] }, { term, solve: (request) => {
    const response = solved(request);
    if (response.ok) response.schedules[0].courses[0].sections.push(discussion.id);
    return response;
  } });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  for (const heading of ["Lab CX01", "Discussion D01"]) {
    const card = within(screen.getByRole("heading", { name: heading }).closest("article")!);
    expect(card.getByText("Unity Hall 400").parentElement).toHaveTextContent(/^Unity Hall 400$/);
    expect(card.queryByText(/Ye Lu|Discussion Tutor/)).not.toBeInTheDocument();
    expect(card.queryByRole("link")).not.toBeInTheDocument();
  }
  expect(screen.queryByText("Compatible")).not.toBeInTheDocument();
  // Every option has this discussion, so there's nothing to lock it against.
  expect(within(screen.getByRole("heading", { name: "Discussion D01" }).closest("article")!).getByText("Only discussion")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Lock Lab CX01" }));
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01"] });
  expect(await screen.findByRole("button", { name: "Unlock Lab CX01" })).toBeInTheDocument();
});

it("hides the lecture professor for one co-taught lecture, since choosing would change nothing", async () => {
  const term = termFile("2027-C");
  term.courses[0].sections[0].instructors = ["Ye Lu", "Alex Smith"];
  const { store } = await startTestPlanner({ courses: ["AE 2320"] }, { term });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
});

it("links a lecture instructor to OSCAR and Rate My Professors in new tabs before a professor is selected", async () => {
  const { store } = await startTestPlanner({ courses: ["AE 2320"] });
  render(<PlannerProvider store={store}><CourseDetailsPanel /></PlannerProvider>);

  const lecture = within(screen.getByRole("heading", { name: "Lecture CL01" }).closest("article")!);
  const oscar = lecture.getByRole("link", { name: "View Ye Lu in OSCAR (opens in a new tab)" });
  expect(oscar).toHaveAttribute("href", "https://oscar.wpi.edu");
  const reviews = lecture.getByRole("link", { name: "View Ye Lu on Rate My Professors (opens in a new tab)" });
  expect(reviews).toHaveAttribute("href", "https://www.ratemyprofessors.com/search/professors/1220?q=Ye%20Lu");
  for (const link of [oscar, reviews]) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  }
});
