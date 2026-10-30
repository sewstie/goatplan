import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { polyfillDialog, startTestPlanner } from "@/components/sections/testing/plannerStore";
import type { PlanBlockedTime } from "@/lib/store";
import { BlockedTimeMenu } from "./BlockedTimeMenu";
import { useBlockedTimeMenu } from "./useBlockedTimeMenu";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

afterEach(() => {
  useBlockedTimeMenu.setState({ open: null, selected: [] });
});

const work: PlanBlockedTime = { day: "Mon", start: 720, end: 750, label: "Work" };

/** A stand-in calendar block and "Block a time" pill around the menu, with the popover open on the block. */
async function openOn(block: PlanBlockedTime, blocked: PlanBlockedTime[] = [block]) {
  const planner = await startTestPlanner({ courses: ["AE 2320"], preferences: { startsAfter: 0, blocked, onlyOpen: true } });
  render(
    <>
      <button type="button" id="tutorial-block-time">Block a time</button>
      <button type="button" data-blocked-time={`${block.day}-${block.start}-${block.end}`}>The block</button>
      <button type="button">After the block</button>
      <BlockedTimeMenu />
    </>,
  );
  const anchor = screen.getByRole("button", { name: "The block" });
  act(() => useBlockedTimeMenu.getState().toggle(block, anchor));
  return { ...planner, anchor };
}

describe("BlockedTimeMenu", () => {
  it("shows the name, day and time, and starts on Rename", async () => {
    await openOn(work);
    const popover = screen.getByRole("dialog", { name: "Work" });
    expect(popover).toHaveTextContent("Monday 12:00–12:30 PM");
    expect(within(popover).getByRole("button", { name: "Rename" })).toHaveFocus();
  });

  it("closes on Escape and gives focus back to the block", async () => {
    const { anchor } = await openOn(work);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(anchor).toHaveFocus();
  });

  it("closes on a click elsewhere or a scroll", async () => {
    await openOn(work);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog", { name: "Work" })).not.toBeInTheDocument();

    act(() => useBlockedTimeMenu.getState().toggle(work, screen.getByRole("button", { name: "The block" })));
    fireEvent.scroll(window);
    expect(screen.queryByRole("dialog", { name: "Work" })).not.toBeInTheDocument();
  });

  it("keeps Tab in page order: back to the block, or on to what follows it", async () => {
    const { anchor } = await openOn(work);
    await userEvent.tab({ shift: true });
    expect(anchor).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => useBlockedTimeMenu.getState().toggle(work, anchor));
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Remove" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "After the block" })).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers no Rename for a time outside the form's choices", async () => {
    await openOn({ day: "Tue", start: 360, end: 420 });
    const popover = screen.getByRole("dialog", { name: "Blocked time" });
    expect(within(popover).queryByRole("button", { name: "Rename" })).not.toBeInTheDocument();
    expect(within(popover).getByRole("button", { name: "Remove" })).toHaveFocus();
  });

  it("removes just that time so it can be undone, and moves focus to Block a time", async () => {
    const other = { day: "Tue" as const, start: 720, end: 750, label: "Work" };
    const { store } = await openOn(work, [work, other]);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(store.getState().preferences.blocked).toEqual([other]);
    expect(store.getState().blockedChange).toMatchObject({ days: ["Mon"], start: 720, end: 750, erased: true });
    expect(screen.getByRole("button", { name: "Block a time" })).toHaveFocus();
  });

  it("renames from the filled-in form", async () => {
    const { store } = await openOn(work);
    await userEvent.click(screen.getByRole("button", { name: "Rename" }));
    const form = screen.getByRole("dialog", { name: "Block a time" });
    const name = within(form).getByRole("textbox", { name: "Name (optional)" });
    expect(name).toHaveValue("Work");
    expect(within(form).getByRole("checkbox", { name: "Monday" })).toBeChecked();
    await userEvent.clear(name);
    await userEvent.type(name, "Gym");
    await userEvent.click(within(form).getByRole("button", { name: "Block time" }));
    expect(store.getState().preferences.blocked).toEqual([{ ...work, label: "Gym" }]);
    expect(screen.getByRole("button", { name: "Block a time" })).toHaveFocus();
  });

  it("gives focus back to the block when Rename is cancelled", async () => {
    const { store, anchor } = await openOn(work);
    await userEvent.click(screen.getByRole("button", { name: "Rename" }));
    await userEvent.click(within(screen.getByRole("dialog", { name: "Block a time" })).getByRole("button", { name: "Cancel" }));
    expect(store.getState().preferences.blocked).toEqual([work]);
    expect(anchor).toHaveFocus();
  });
});
