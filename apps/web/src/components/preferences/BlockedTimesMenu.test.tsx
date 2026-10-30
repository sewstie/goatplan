import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { startTestPlanner } from "@/components/sections/testing/plannerStore";
import { PreferencesBar } from "./PreferencesBar";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

const blocked = [
  { day: "Mon" as const, start: 720, end: 780, label: "Lunch" },
  { day: "Wed" as const, start: 720, end: 780, label: "Lunch" },
  { day: "Thu" as const, start: 900, end: 960 },
];

describe("BlockedTimesMenu", () => {
  it("stands in for the blocked-time pills while drawing, and lists them to remove each", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"], preferences: { startsAfter: 0, blocked, onlyOpen: true } });
    render(<PreferencesBar />);
    expect(screen.getAllByRole("button", { name: /^Remove blocked time/ })).toHaveLength(2);

    act(() => store.getState().setDrawing(true));
    expect(screen.queryAllByRole("button", { name: /^Remove blocked time/ })).toHaveLength(0);
    const pill = screen.getByRole("button", { name: "2 blocked times" });
    await userEvent.click(pill);
    const list = screen.getByRole("list", { name: "Blocked times" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Lunch · Mon, Wed 12 PM–1 PM", "Thu 3 PM–4 PM"]);

    await userEvent.click(within(list).getByRole("button", { name: "Remove blocked time Lunch, Mon, Wed 12 PM–1 PM" }));
    expect(store.getState().preferences.blocked).toEqual([blocked[2]]);
    expect(within(list).getByRole("button", { name: "Remove blocked time Thu 3 PM–4 PM" })).toHaveFocus();
    expect(store.getState().drawing).toBe(true);
  });

  it("closes on Escape without leaving drawing mode", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"], preferences: { startsAfter: 0, blocked, onlyOpen: true } });
    render(<PreferencesBar />);
    act(() => store.getState().setDrawing(true));
    const pill = screen.getByRole("button", { name: "2 blocked times" });
    await userEvent.click(pill);
    await userEvent.keyboard("{Escape}");
    expect(pill).toHaveAttribute("aria-expanded", "false");
    expect(pill).toHaveFocus();
    expect(store.getState().drawing).toBe(true);
  });

  it("keeps its place with no blocked times", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);
    act(() => store.getState().setDrawing(true));
    expect(screen.getByRole("button", { name: "No blocked times" })).toBeDisabled();
  });
});
