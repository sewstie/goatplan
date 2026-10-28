import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { startTestPlanner } from "@/components/sections/testing/plannerStore";
import { makeSection, orbitalMechanics } from "@/components/sections/testing/sections";
import type { TermFile } from "@/lib/data/types";
import { PlannerProvider } from "@/lib/store";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import type { Draft } from "@/lib/store/types";
import { PhoneCourseDetails } from "./PhoneCourseDetails";

async function details(draft: Partial<Draft> = {}, term: TermFile = termFile("2027-C")) {
  const course = term.courses[0];
  const { store } = await startTestPlanner({ courses: [course.code], ...draft }, { term, solve: (request) => {
    const response = solved(request);
    if (response.ok) {
      const locked = request.preferences?.locked?.[course.code] ?? [];
      const ids = course.options.find((option) => locked.every((id) => option.includes(id)))!;
      response.schedules = [{ ...response.schedules[0], courses: [{ ...response.schedules[0].courses[0], code: course.code, sections: ids, alternatives: [ids] }] }];
    }
    return response;
  } });
  render(<PlannerProvider store={store}><CourseDetailsPanel renderCourse={(item) => <PhoneCourseDetails key={item.code} course={item} />} /></PlannerProvider>);
  return store;
}

function orbitalTerm() {
  const term = termFile("2027-C");
  term.courses[0] = structuredClone(orbitalMechanics);
  return term;
}

function seminarTerm() {
  const term = termFile("2027-C");
  const lecture = (code: string, start: number, instructor: string) => makeSection(`DEMO 3001-${code}`, {
    instructors: [instructor], meetings: [{ days: ["Tue", "Thu"], start, end: start + 50, location: "Example Hall 101" }],
  });
  const lab = makeSection("DEMO 3001-B01", { type: "lab", instructors: ["Sam Patel"], meetings: [{ days: ["Fri"], start: 900, end: 950, location: "Example Lab 202" }] });
  const lectures = [lecture("L01", 480, "Alex Rivera"), lecture("L02", 600, "Jordan Kim"), lecture("L03", 660, "Morgan Lee")];
  term.courses[0] = {
    code: "DEMO 3001", subject: "DEMO", title: "Engineering Seminar", credits: 1, level: "Undergraduate", description: "",
    sections: [...lectures, lab],
    options: lectures.map((item) => [item.id, lab.id]),
  };
  return term;
}

it("shows the course with its lecture and lab cards, and no professor field for a single professor", async () => {
  await details({}, orbitalTerm());

  expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();
  expect(screen.getByText("Introduction to Orbital Mechanics")).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Lecture professor" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Sections in this schedule" })).not.toBeInTheDocument();
  const lecture = within(screen.getByRole("heading", { name: "Lecture CL01" }).closest("article")!);
  expect(lecture.getByText("Only lecture")).toBeInTheDocument();
  expect(lecture.getByText("Mon–Fri · 9:00–9:50 AM")).toBeInTheDocument();
  expect(lecture.getByRole("link", { name: /Rate My Professors/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Change lab 2 other times" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: /^Change lecture/ })).not.toBeInTheDocument();
});

it("picks another lab from Change lab, which locks it and closes the list", async () => {
  const store = await details({}, orbitalTerm());
  const user = userEvent.setup();
  const change = screen.getByRole("button", { name: "Change lab 2 other times" });
  await user.click(change);
  const list = screen.getByRole("list", { name: "Other lab choices" });
  expect(within(list).getByText("CX02")).toBeInTheDocument();
  await user.click(within(list).getByRole("button", { name: /^Choose CX02,/ }));

  await waitFor(() => expect(screen.getByRole("button", { name: "Unlock Lab CX02" })).toBeInTheDocument());
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX02"] });
  expect(screen.queryByRole("list", { name: "Other lab choices" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Change lab/ })).toHaveFocus();
});

it("asks to unlock a locked lab before another one can be chosen, and closes on Escape", async () => {
  await details({ locks: { "AE 2320": ["AE 2320-CX02"] } }, orbitalTerm());
  const user = userEvent.setup();
  const change = screen.getByRole("button", { name: /^Change lab/ });
  await user.click(change);

  expect(screen.getByText("Unlock CX02 to choose another lab.")).toBeInTheDocument();
  const list = screen.getByRole("list", { name: "Other lab choices" });
  expect(within(list).getByText("CX01")).toBeInTheDocument();
  expect(within(list).queryByRole("button")).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(change).toHaveFocus();
  expect(change).toHaveAttribute("aria-expanded", "false");
});

it("names who teaches a seminar, but not a lab", async () => {
  const term = seminarTerm();
  term.courses[0].sections[0] = { ...term.courses[0].sections[0], type: "seminar" };
  await details({}, term);
  const seminar = within(screen.getByRole("heading", { name: /^Seminar L0/ }).closest("article")!);
  expect(seminar.getByText(/Alex Rivera|Jordan Kim|Morgan Lee/)).toBeInTheDocument();
  const lab = within(screen.getByRole("heading", { name: "Lab B01" }).closest("article")!);
  expect(lab.queryByText("Sam Patel")).not.toBeInTheDocument();
});

it("offers a lecture professor menu like the desktop one", async () => {
  const store = await details({}, seminarTerm());
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Lecture professor" }));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Any professor", "Alex Rivera", "Jordan Kim", "Morgan Lee"]);
  await user.click(screen.getByRole("option", { name: "Jordan Kim" }));
  expect(store.getState().professorByCourse).toEqual({ "DEMO 3001": "Jordan Kim" });
});

it("offers other professors under Change lecture with their ratings, and picks one", async () => {
  const store = await details({}, seminarTerm());
  const user = userEvent.setup();
  expect(screen.getByRole("button", { name: "Lock Lecture L01" })).toBeInTheDocument();
  const lab = within(screen.getByRole("heading", { name: "Lab B01" }).closest("article")!);
  expect(lab.getByText("Only lab")).toBeInTheDocument();
  expect(lab.queryByText("Sam Patel")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Change lecture 2 other professors" }));
  const list = screen.getByRole("list", { name: "Other lecture choices" });
  expect(within(list).getByRole("group", { name: "Jordan Kim" })).toBeInTheDocument();
  expect(within(list).getByRole("link", { name: /Rate My Professors: Morgan Lee/ })).toBeInTheDocument();
  await user.click(within(list).getByRole("button", { name: /^Choose Lecture L03,/ }));

  await waitFor(() => expect(screen.getByRole("button", { name: "Unlock Lecture L03" })).toBeInTheDocument());
  expect(store.getState().locks).toEqual({ "DEMO 3001": ["DEMO 3001-L03"] });
});
