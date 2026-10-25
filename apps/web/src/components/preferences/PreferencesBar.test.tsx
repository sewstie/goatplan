import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SORT_PRESETS } from "@/lib/store";
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

  it("shows Sort with the current order and lists all six orders in table order", async () => {
    await startTestPlanner({ courses: ["AE 2320"], sortPreset: "fewestEarly" });
    render(<PreferencesBar />);

    const sort = screen.getByRole("combobox", { name: "Sort" });
    expect(sort).toHaveTextContent("SortFewest early classes");
    expect(sort).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(sort);

    const list = screen.getByRole("listbox", { name: "Sort" });
    expect(within(list).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Best overall",
      "Fewest early classes",
      "Latest start",
      "Earliest finish",
      "Most days off",
      "Most compact",
    ]);
    expect(within(list).getByRole("option", { selected: true })).toHaveTextContent("Fewest early classes");
  });

  it("picks an order from the keyboard, solves with its weights, shows schedule 1 and keeps focus on Sort", async () => {
    const { store, requests } = await startTestPlanner({ courses: ["AE 2320"], sortPreset: "fewestEarly" });
    store.getState().setScheduleIndex(1);
    render(<PreferencesBar />);

    const sort = screen.getByRole("combobox", { name: "Sort" });
    sort.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("L");
    expect(sort).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Latest start" }).id);
    await userEvent.keyboard("{Enter}");

    expect(store.getState().sortPreset).toBe("latestStart");
    await waitForSolve(store);
    expect(requests.at(-1)?.sort).toEqual(SORT_PRESETS.latestStart.weights);
    expect(store.getState().scheduleIndex).toBe(0);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort" })).toBe(sort);
    expect(sort).toHaveFocus();
    expect(sort).toHaveTextContent("SortLatest start");
  });

  it("picks an order with a click and keeps Sort on screen while it solves", async () => {
    let release: (() => void) | null = null;
    const { store } = await startTestPlanner(
      { courses: ["AE 2320"], sortPreset: "bestOverall" },
      {
        solve: (request) =>
          request.sort?.perGapMinute === SORT_PRESETS.fewestGaps.weights.perGapMinute
            ? new Promise((resolve) => (release = () => resolve(solved(request))))
            : solved(request),
      },
    );
    render(<PreferencesBar />);

    await userEvent.click(screen.getByRole("combobox", { name: "Sort" }));
    await userEvent.click(screen.getByRole("option", { name: "Most compact" }));

    expect(store.getState().sortPreset).toBe("fewestGaps");
    await waitFor(() => expect(store.getState().solveStatus).toBe("solving"));
    const sort = screen.getByRole("combobox", { name: "Sort" });
    expect(sort).toHaveFocus();
    expect(sort).toHaveTextContent("SortMost compact");
    release!();
    await waitForSolve(store);
    expect(sort).toHaveFocus();
  });

  it("keeps the order on Escape", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"], sortPreset: "bestOverall" });
    render(<PreferencesBar />);

    const sort = screen.getByRole("combobox", { name: "Sort" });
    sort.focus();
    await userEvent.keyboard("{ArrowDown}{End}{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(store.getState().sortPreset).toBe("bestOverall");
    expect(sort).toHaveFocus();
  });

  it("makes Sort the last stop in the row, and Tab moves past it without opening it", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(
      <>
        <PreferencesBar />
        <button type="button">After the row</button>
      </>,
    );

    screen.getByRole("switch", { name: "Only open sections" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "After the row" })).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
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

  it("hides Sort once a change leaves only one schedule", async () => {
    const { store } = await startTestPlanner(
      { courses: ["AE 2320"] },
      {
        solve: (request) => {
          const response = solved(request);
          if (!response.ok || request.preferences?.startsAfter !== 600) return response;
          return { ...response, total: 1, schedules: response.schedules.slice(0, 1) };
        },
      },
    );
    render(<PreferencesBar />);
    expect(screen.getByRole("combobox", { name: "Sort" })).toBeInTheDocument();

    store.getState().setPreferences({ startsAfter: 600 });
    await waitForSolve(store);

    await waitFor(() => expect(screen.queryByRole("combobox", { name: "Sort" })).not.toBeInTheDocument());
  });
});
