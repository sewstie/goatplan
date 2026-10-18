import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { rateMyProfessorsUrl } from "@/lib/data";
import type { SolveResponse } from "@/lib/engine/types";
import { ChooseAlternativeSheet } from "./ChooseAlternativeSheet";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { polyfillDialog, startTestPlanner, waitForSolve } from "./testing/plannerStore";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("./testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

const nothingFits = (): SolveResponse => ({
  ok: true,
  version: 1,
  termId: "2027-C",
  total: 0,
  patterns: 0,
  capped: false,
  steps: 1,
  elapsedMs: 1,
  schedules: [],
  diagnosis: { unsure: false, emptyCourses: [], clashingPairs: [], minimalClash: [], fixes: [] },
});

const card = (name: string) => screen.getByRole("heading", { name }).closest("article") as HTMLElement;

describe("CourseDetailsPanel", () => {
  it("shows the intro before any course is added", async () => {
    await startTestPlanner();
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("heading", { name: "Your term starts here" })).toBeInTheDocument();
    expect(screen.getByText("Search for a course or professor.")).toBeInTheDocument();
  });

  it("shows the chosen sections with their facts", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("heading", { level: 2, name: "AE 2320" })).toBeInTheDocument();
    const lecture = card("Lecture CL01");
    expect(within(lecture).getByText("Only lecture")).toBeInTheDocument();
    expect(within(lecture).queryByRole("button")).not.toBeInTheDocument();
    expect(within(lecture).getByText("Mon · 9:00 AM–9:50 AM")).toBeInTheDocument();
    expect(within(lecture).getByText("Unity Hall 400")).toBeInTheDocument();
    expect(within(lecture).getByText("30 of 40 seats open")).toBeInTheDocument();
    expect(within(lecture).getByText("Ye Lu")).toBeInTheDocument();
    expect(within(card("Lab CX01")).getByRole("button", { name: "Lock Lab CX01" })).toBeInTheDocument();
  });

  it("locks and unlocks a section", async () => {
    const { store, requests } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<CourseDetailsPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Lock Lab CX01" }));
    expect(store.getState().locks).toEqual({ "AE 2320": ["AE 2320-CX01"] });
    await waitForSolve(store);
    expect(requests.at(-1)?.preferences?.locked).toEqual({ "AE 2320": ["AE 2320-CX01"] });

    await userEvent.click(await screen.findByRole("button", { name: "Unlock Lab CX01" }));
    expect(store.getState().locks).toEqual({});
    expect(await screen.findByRole("button", { name: "Lock Lab CX01" })).toBeInTheDocument();
  });

  it("keeps locked sections on screen when nothing fits, so they can be unlocked", async () => {
    const { store } = await startTestPlanner(
      { courses: ["AE 2320"], locks: { "AE 2320": ["AE 2320-CX02"] } },
      { solve: nothingFits },
    );
    render(<CourseDetailsPanel />);

    expect(screen.getByText("No schedule fits with this course right now.")).toBeInTheDocument();
    await userEvent.click(within(card("Lab CX02")).getByRole("button", { name: "Unlock Lab CX02" }));
    expect(store.getState().locks).toEqual({});
  });

  it("links the picked professor to Rate My Professors", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<CourseDetailsPanel />);

    expect(screen.getByRole("combobox", { name: "Professor" })).toHaveDisplayValue("Ye Lu");
    const link = screen.getByRole("link", { name: /Rate My Professors/ });
    expect(link).toHaveAttribute("href", rateMyProfessorsUrl("Ye Lu"));
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("ChooseAlternativeSheet", () => {
  it("lists the same-time labs and applies the pick through the store", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(
      <>
        <CourseDetailsPanel />
        <ChooseAlternativeSheet />
      </>,
    );

    const opener = screen.getByRole("button", { name: "View other lab choices" });
    await userEvent.click(opener);
    const sheet = screen.getByRole("dialog", { name: "AE 2320" });
    expect(within(sheet).getByText(/same time as your lab CX01/)).toBeInTheDocument();
    const group = within(sheet).getByRole("group", { name: "Other lab choices" });
    const radio = within(group).getByRole("radio", { name: /CX02/ });
    expect(radio).toBeChecked();
    expect(within(group).getByText("30 open")).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole("button", { name: "Pick CX02" }));

    const key = Object.keys(store.getState().alternatives)[0];
    expect(store.getState().alternatives[key]).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
    expect(store.getState().solveStatus).toBe("done");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lab CX02" })).toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("closes without changing anything", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(
      <>
        <CourseDetailsPanel />
        <ChooseAlternativeSheet />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "View other lab choices" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().alternatives).toEqual({});
  });
});
