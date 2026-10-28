import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, it } from "vitest";
import { PlannerProvider } from "@/lib/store";
import type { Draft } from "@/lib/store/types";
import type { TermFile } from "@/lib/data/types";
import { solved, termFile } from "@/lib/store/testing/fixtures";
import { ChooseAlternativeSheet } from "./ChooseAlternativeSheet";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { polyfillDialog, startTestPlanner, waitForSolve } from "./testing/plannerStore";
import { makeSection, orbitalMechanics } from "./testing/sections";
import { ScheduleView } from "@/components/schedule/ScheduleView";

beforeAll(polyfillDialog);

async function panel(draft: Partial<Draft> = {}, data?: TermFile) {
  const term = data ?? termFile("2027-C");
  if (!data) term.courses[0] = structuredClone(orbitalMechanics);
  term.courses[1].sections[0].meetings[0].start = 600;
  term.courses[1].sections[0].meetings[0].end = 650;
  const { store } = await startTestPlanner({ courses: ["AE 2320"], ...draft }, { term, solve: (request) => {
    const response = solved(request);
    if (response.ok) {
      const ids = term.courses[0].options.find((option) => (request.preferences?.locked?.["AE 2320"] ?? []).every((id) => option.includes(id)))!;
      response.schedules = [{ ...response.schedules[0], courses: response.schedules[0].courses.map((course) => course.code === "AE 2320" ? { ...course, sections: ids, alternatives: [ids] } : course) }];
    }
    return response;
  } });
  render(<PlannerProvider store={store}><CourseDetailsPanel /><ChooseAlternativeSheet /><ScheduleView /></PlannerProvider>);
  return store;
}

it("opens other labs inline, leaves out the current lab, and returns focus on Esc", async () => {
  await panel();
  const user = userEvent.setup();
  const disclosure = screen.getByRole("button", { name: "View other lab choices" });
  const card = screen.getByRole("heading", { name: "Lab CX01" }).closest("article")!;
  const look = [card.className, disclosure.className];
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await user.click(disclosure);
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(disclosure).toHaveAccessibleName("Hide other lab choices");
  // Opening the list leaves the card and the toggle as they were, so nothing above it moves.
  expect(screen.getByRole("heading", { name: "Lab CX01" }).closest("article")).toBe(card);
  expect([card.className, disclosure.className]).toEqual(look);
  const list = screen.getByRole("list", { name: "Other lab choices" });
  expect(list).toHaveAttribute("id", disclosure.getAttribute("aria-controls"));
  expect(within(list).queryByRole("button", { name: "Choose CX01" })).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.tab();
  expect(within(list).getByRole("button", { name: "Choose CX02" })).toHaveFocus();
  await user.tab();
  expect(within(list).getByRole("button", { name: "Choose CX04" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("list", { name: "Other lab choices" })).not.toBeInTheDocument();
  expect(disclosure).toHaveFocus();
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
});

it("previews a lab on hover or focus without replacing the current calendar block", async () => {
  const store = await panel();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "View other lab choices" }));
  const choice = screen.getByRole("button", { name: "Choose CX02" });
  const current = screen.getByRole("button", { name: /^AE 2320 CX01,/ });
  await user.hover(choice);
  expect(screen.getByRole("button", { name: /^Preview, AE 2320 CX02,/ })).toBeInTheDocument();
  expect(within(choice).getByText("Previewing")).toBeInTheDocument();
  expect(current).toBeInTheDocument();
  expect(store.getState().locks).toEqual({});
  await user.unhover(choice);
  expect(screen.queryByRole("button", { name: /^Preview,/ })).not.toBeInTheDocument();
  await user.tab();
  expect(choice).toHaveFocus();
  expect(screen.getByRole("button", { name: /^Preview, AE 2320 CX02,/ })).toBeInTheDocument();
  await user.tab();
  expect(screen.queryByRole("button", { name: /^Preview, AE 2320 CX02,/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Preview, AE 2320 CX04,/ })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: /^Preview,/ })).not.toBeInTheDocument();
});

it("chooses a lab with the keyboard, moves its lock, preserves other locks, and focuses Unlock", async () => {
  const store = await panel({ courses: ["AE 2320", "AE 2410"], locks: {
    "AE 2320": ["AE 2320-CL01", "AE 2320-CX01"], "AE 2410": ["AE 2410-C01"],
  } });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "View other lab choices" }));
  await user.tab();
  await user.keyboard("{Enter}");

  await waitFor(() => expect(screen.getByRole("button", { name: "Unlock Lab CX02" })).toHaveFocus());
  expect(store.getState().locks).toEqual({
    "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"], "AE 2410": ["AE 2410-C01"],
  });
  expect(screen.queryByRole("list", { name: "Other lab choices" })).not.toBeInTheDocument();
});

it("keeps the choice sheet available when activating a selected calendar block", async () => {
  await panel();
  const user = userEvent.setup();
  const lab = screen.getByRole("button", { name: /^AE 2320 CX01,/ });
  await user.click(lab);
  await user.click(lab);
  expect(screen.getByRole("dialog", { name: "Choose a lab" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
});

it("opens a lab and a discussion from their own cards and preserves the other component's lock", async () => {
  const term = termFile("2027-C");
  const course = structuredClone(orbitalMechanics);
  term.courses[0] = course;
  const discussion = makeSection("AE 2320-D01", { type: "discussion", meetings: [{ days: ["Mon"], start: 720, end: 770, location: "" }] });
  const other = { ...discussion, id: "AE 2320-D02", code: "D02" };
  course.sections.push(discussion, other);
  course.options = course.options.flatMap((option) => [[...option, discussion.id], [...option, other.id]]);
  const store = await panel({ locks: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX01", discussion.id] } }, term);
  const user = userEvent.setup();
  const labDisclosure = screen.getByRole("button", { name: "View other lab choices" });
  const discussionDisclosure = screen.getByRole("button", { name: "View other discussion choices" });
  const labCard = screen.getByRole("heading", { name: "Lab CX01" }).closest("article")!;
  const discussionCard = screen.getByRole("heading", { name: "Discussion D01" }).closest("article")!;
  expect(labCard.nextElementSibling).toBe(labDisclosure);
  expect(discussionCard.nextElementSibling).toBe(discussionDisclosure);
  await user.click(labDisclosure);
  expect(screen.queryByRole("button", { name: "Choose D02" })).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await user.click(discussionDisclosure);
  expect(screen.queryByRole("button", { name: "Choose CX02" })).not.toBeInTheDocument();
  await user.tab();
  await user.keyboard(" ");
  await waitFor(() => expect(screen.getByRole("button", { name: "Unlock Discussion D02" })).toHaveFocus());
  expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX01", "AE 2320-D02"] });
});

it("removes stale choices and previews while a new solve is pending", async () => {
  const store = await panel();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "View other lab choices" }));
  await user.tab();
  act(() => store.getState().setPreferences({ startsAfter: 540 }));
  expect(screen.queryByRole("button", { name: "Choose CX02" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Preview,/ })).not.toBeInTheDocument();
  await waitForSolve(store);
});

it("keeps the current calendar block in place when another lab meets at the same time", async () => {
  const term = termFile("2027-C");
  const course = structuredClone(orbitalMechanics);
  term.courses[0] = course;
  course.sections[2].meetings = structuredClone(course.sections[1].meetings);
  await panel({}, term);
  const user = userEvent.setup();
  const current = screen.getByRole("button", { name: /^AE 2320 CX01,/ });
  const width = current.style.width;
  const left = current.style.left;
  await user.click(screen.getByRole("button", { name: "View other lab choices" }));
  await user.hover(screen.getByRole("button", { name: "Choose CX02" }));
  expect(screen.getByRole("button", { name: /^Preview, AE 2320 CX02,/ })).toBeInTheDocument();
  expect(current.style.width).toBe(width);
  expect(current.style.left).toBe(left);
});
