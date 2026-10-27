import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DayCalendar } from "./DayCalendar";
import { resetPlanner, setPlanner } from "./testing/plannerFixtures";

afterEach(resetPlanner);

function renderDayCalendar() {
  setPlanner();
  return render(<DayCalendar />);
}

describe("DayCalendar tab keyboard navigation", () => {
  it("renders a tablist with day tabs", () => {
    renderDayCalendar();
    const tablist = screen.getByRole("tablist", { name: "Days of the week" });
    const tabs = within(tablist).getAllByRole("tab");
    // Default fixtures have weekday-only classes (Mon–Fri)
    expect(tabs).toHaveLength(5);
    expect(tabs.map((t) => t.textContent)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  });

  it("only the selected tab is in the tab order", () => {
    renderDayCalendar();
    const tabs = screen.getAllByRole("tab");
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true")!;
    expect(selected).toHaveAttribute("tabindex", "0");
    for (const tab of tabs) {
      if (tab !== selected) {
        expect(tab).toHaveAttribute("tabindex", "-1");
      }
    }
  });

  it("ArrowRight moves to the next tab", async () => {
    renderDayCalendar();
    const user = userEvent.setup();
    const tabs = screen.getAllByRole("tab");
    // Focus the selected tab first
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true")!;
    selected.focus();
    await user.keyboard("{ArrowRight}");
    // The next tab should now be selected and focused
    const newSelected = tabs.find((t) => t === document.activeElement)!;
    expect(newSelected).toHaveAttribute("aria-selected", "true");
    expect(newSelected).not.toBe(selected);
  });

  it("ArrowLeft moves to the previous tab", async () => {
    renderDayCalendar();
    const user = userEvent.setup();
    const tabs = screen.getAllByRole("tab");
    // Move right first, then left to verify the wrap-around
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true")!;
    selected.focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");
    // Should be back on the original tab
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveFocus();
  });

  it("ArrowRight wraps from last tab to first", async () => {
    renderDayCalendar();
    const user = userEvent.setup();
    const tabs = screen.getAllByRole("tab");
    // Focus the last tab (Fri)
    const lastTab = tabs[tabs.length - 1];
    // First, select it by clicking
    await user.click(lastTab);
    expect(lastTab).toHaveAttribute("aria-selected", "true");
    // Arrow right should wrap to Mon
    lastTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveFocus();
  });

  it("ArrowLeft wraps from first tab to last", async () => {
    renderDayCalendar();
    const user = userEvent.setup();
    const tabs = screen.getAllByRole("tab");
    // Focus the first tab (Mon)
    const firstTab = tabs[0];
    await user.click(firstTab);
    expect(firstTab).toHaveAttribute("aria-selected", "true");
    firstTab.focus();
    await user.keyboard("{ArrowLeft}");
    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[tabs.length - 1]).toHaveFocus();
  });

  it("Home jumps to the first tab", async () => {
    renderDayCalendar();
    const user = userEvent.setup();
    const tabs = screen.getAllByRole("tab");
    // Move to a middle tab first
    const lastTab = tabs[tabs.length - 1];
    await user.click(lastTab);
    lastTab.focus();
    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveFocus();
  });

  it("End jumps to the last tab", async () => {
    renderDayCalendar();
    const user = userEvent.setup();
    const tabs = screen.getAllByRole("tab");
    const firstTab = tabs[0];
    await user.click(firstTab);
    firstTab.focus();
    await user.keyboard("{End}");
    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[tabs.length - 1]).toHaveFocus();
  });

  it("the panel is labelled by its tab", () => {
    renderDayCalendar();
    const panel = screen.getByRole("tabpanel");
    const selectedTab = screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true")!;
    expect(panel).toHaveAttribute("aria-labelledby", selectedTab.id);
    expect(selectedTab).toHaveAttribute("aria-controls", panel.id);
  });
});
