import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { solved } from "@/lib/store/testing/fixtures";
import { polyfillDialog, startTestPlanner, waitForSolve } from "@/components/sections/testing/plannerStore";
import { PreferencesBar } from "./PreferencesBar";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

const work = [
  { day: "Tue" as const, start: 840, end: 960 },
  { day: "Fri" as const, start: 840, end: 960 },
];

describe("PreferencesBar", () => {
  it("changes the start time", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const select = screen.getByRole("combobox", { name: "Starts after" });
    expect(select).toHaveDisplayValue("Any time");
    await userEvent.selectOptions(select, "10:00 AM");

    expect(store.getState().preferences.startsAfter).toBe(600);
    await waitForSolve(store);
  });

  it("shows a blocked time as one pill and removes it", async () => {
    const { store } = await startTestPlanner({
      courses: ["AE 2320"],
      preferences: { startsAfter: 540, blocked: work, onlyOpen: true },
    });
    render(<PreferencesBar />);

    expect(screen.getByText("Tue, Fri")).toBeInTheDocument();
    expect(screen.getByText("2 PM–4 PM")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove blocked time Tue, Fri 2 PM–4 PM" }));

    expect(store.getState().preferences.blocked).toEqual([]);
    expect(screen.queryByText("Tue, Fri")).not.toBeInTheDocument();
  });

  it("moves focus to the next pill, then to Block a time, as pills are removed", async () => {
    await startTestPlanner({
      courses: ["AE 2320"],
      preferences: { startsAfter: 540, blocked: [...work, { day: "Mon", start: 720, end: 780 }], onlyOpen: true },
    });
    render(<PreferencesBar />);

    screen.getByRole("button", { name: "Remove blocked time Tue, Fri 2 PM–4 PM" }).focus();
    await userEvent.keyboard("{Enter}");
    const lunch = screen.getByRole("button", { name: "Remove blocked time Mon 12 PM–1 PM" });
    expect(lunch).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Block a time" })).toHaveFocus();
  });

  it("adds a blocked time from the form", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    await userEvent.click(screen.getByRole("button", { name: "Block a time" }));
    const dialog = screen.getByRole("dialog", { name: "Block a time" });
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Monday" }));
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Wednesday" }));
    await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "From" }), "10:00 AM");
    await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "To" }), "11:30 AM");
    await userEvent.click(within(dialog).getByRole("button", { name: "Block time" }));

    expect(store.getState().preferences.blocked).toEqual([
      { day: "Mon", start: 600, end: 690 },
      { day: "Wed", start: 600, end: 690 },
    ]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Mon, Wed")).toBeInTheDocument();
    expect(screen.getByText("10 AM–11:30 AM")).toBeInTheDocument();
  });

  it("names a blocked time when asked, like the design's Work pill", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    await userEvent.click(screen.getByRole("button", { name: "Block a time" }));
    const dialog = screen.getByRole("dialog", { name: "Block a time" });
    const name = within(dialog).getByRole("textbox", { name: "Name (optional)" });
    expect(name).toHaveValue("");
    await userEvent.type(name, "Work");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Tuesday" }));
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Friday" }));
    await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "From" }), "2:00 PM");
    await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "To" }), "4:00 PM");
    await userEvent.click(within(dialog).getByRole("button", { name: "Block time" }));

    expect(store.getState().preferences.blocked).toEqual([
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Fri", start: 840, end: 960, label: "Work" },
    ]);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("· Tue, Fri 2 PM–4 PM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove blocked time Work, Tue, Fri 2 PM–4 PM" })).toBeInTheDocument();
  });

  it("opens the block form with focus in the name field, not on Close", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    await userEvent.click(screen.getByRole("button", { name: "Block a time" }));
    const dialog = screen.getByRole("dialog", { name: "Block a time" });
    expect(within(dialog).getByRole("textbox", { name: "Name (optional)" })).toHaveFocus();
    expect(within(dialog).getByRole("button", { name: "Close" })).not.toHaveFocus();
  });

  it("asks for a day before blocking a time", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    await userEvent.click(screen.getByRole("button", { name: "Block a time" }));
    const dialog = screen.getByRole("dialog", { name: "Block a time" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Block time" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Pick at least one day.");
    expect(store.getState().preferences.blocked).toEqual([]);
  });

  it("keeps the end of a blocked time after its start", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    await userEvent.click(screen.getByRole("button", { name: "Block a time" }));
    const dialog = screen.getByRole("dialog", { name: "Block a time" });
    await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "From" }), "3:00 PM");

    const to = within(dialog).getByRole("combobox", { name: "To" });
    expect(to).toHaveDisplayValue("4:00 PM");
    expect(within(to).queryByRole("option", { name: "3:00 PM" })).not.toBeInTheDocument();
  });

  it("turns Only open sections off", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const toggle = screen.getByRole("switch", { name: "Only open sections" });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);

    expect(store.getState().preferences.onlyOpen).toBe(false);
    expect(toggle).not.toBeChecked();
  });

  it("offers only the sort order in the design when several schedules fit", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const sort = screen.getByRole("combobox", { name: "Sort" });
    expect(within(sort).getAllByRole("option").map((option) => option.textContent)).toEqual(["Fewest early classes"]);
  });

  it("hides Sort when only one schedule fits", async () => {
    await startTestPlanner(
      { courses: ["AE 2320"] },
      {
        solve: (request) => {
          const response = solved(request);
          return response.ok ? { ...response, total: 1, schedules: response.schedules.slice(0, 1) } : response;
        },
      },
    );
    render(<PreferencesBar />);

    expect(screen.queryByRole("combobox", { name: "Sort" })).not.toBeInTheDocument();
  });
});
