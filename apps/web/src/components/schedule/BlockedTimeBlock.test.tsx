import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BlockedTimeBlock } from "./BlockedTimeBlock";

const work = { day: "Mon" as const, start: 720, end: 750, label: "Work" };

describe("BlockedTimeBlock", () => {
  it("shows its name, time and \"blocked\" when there's room", () => {
    render(<BlockedTimeBlock {...work} end={840} density="regular" layout="full" style={{}} />);
    const block = screen.getByRole("img", { name: "Work, Monday 12:00 to 2:00 PM, blocked" });
    expect(block).toHaveTextContent("Work12:00 PM–2:00 PMblocked");
  });

  it("fits a short block on one centered line and keeps the full text in its label and tooltip", async () => {
    render(<BlockedTimeBlock {...work} density="regular" layout="line" style={{}} />);
    const block = screen.getByRole("img", { name: "Work, Monday 12:00 to 12:30 PM, blocked" });
    expect(block).toHaveTextContent(/^Work · 12–12:30$/);
    const text = block.querySelector("[data-blocked-text]")!;
    expect(text.className).toContain("items-center");
    expect(text.className).not.toContain("pt-12.5");

    await userEvent.hover(block);
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("WorkMonday 12:00–12:30 PMblocked");
  });

  it("hides its text only where a class lies on top of it", () => {
    render(<BlockedTimeBlock {...work} end={840} density="regular" layout="full" style={{}} coveredBy={[{ start: 690, end: 750 }]} />);
    const text = screen.getByRole("img").querySelector<HTMLElement>("[data-blocked-text]")!;
    expect(text.style.maskImage).toMatch(/transparent 0%, transparent 25%, black 25%/);
  });

  it("keeps its text whole when nothing covers it", () => {
    render(<BlockedTimeBlock {...work} end={840} density="regular" layout="full" style={{}} coveredBy={[{ start: 600, end: 720 }]} />);
    expect(screen.getByRole("img").querySelector<HTMLElement>("[data-blocked-text]")!.style.maskImage).toBe("");
  });

  it("writes the short time when it has no name", () => {
    render(<BlockedTimeBlock day="Tue" start={900} end={930} density="regular" layout="line" style={{}} />);
    expect(screen.getByRole("img", { name: "Tuesday 3:00 to 3:30 PM, blocked" })).toHaveTextContent(/^3–3:30 PM$/);
  });

  it("is only hatching when even one line doesn't fit", async () => {
    render(<BlockedTimeBlock {...work} density="dense" layout="none" style={{}} />);
    const block = screen.getByRole("img", { name: "Work, Monday 12:00 to 12:30 PM, blocked" });
    expect(block).toHaveTextContent(/^$/);
    await userEvent.hover(block);
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
  });

  it("has no tooltip when its whole text shows", async () => {
    render(<BlockedTimeBlock {...work} density="regular" layout="full" style={{}} />);
    await userEvent.hover(screen.getByRole("img"));
    expect(screen.queryByRole("tooltip", { hidden: true })).not.toBeInTheDocument();
  });

  it("is a button that opens its popover with a click or Enter", async () => {
    const onOpen = vi.fn();
    render(<BlockedTimeBlock {...work} density="regular" layout="line" style={{}} onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Work, Monday 12:00 to 12:30 PM, blocked" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith(button);
  });

  it("shows the erase pointer and no tooltip in drawing mode", async () => {
    render(<BlockedTimeBlock {...work} density="regular" layout="line" style={{}} erasable />);
    const block = screen.getByRole("img");
    expect(block.className).toContain("cursor-erase");
    await userEvent.hover(block);
    expect(screen.queryByRole("tooltip", { hidden: true })).not.toBeInTheDocument();
  });

  it("adds itself to the selection with ⌘-click, Ctrl-click or Ctrl+Enter instead of opening", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onToggleSelected = vi.fn();
    render(<BlockedTimeBlock {...work} density="regular" layout="line" style={{}} onOpen={onOpen} onToggleSelected={onToggleSelected} />);
    const button = screen.getByRole("button", { name: "Work, Monday 12:00 to 12:30 PM, blocked" });

    await user.keyboard("{Meta>}");
    await user.click(button);
    await user.keyboard("{/Meta}{Control>}");
    await user.click(button);
    await user.keyboard("{/Control}");
    button.focus();
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(onToggleSelected).toHaveBeenCalledTimes(3);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("says when it's selected and shows it with an accent ring", () => {
    render(<BlockedTimeBlock {...work} density="regular" layout="line" style={{}} onOpen={() => {}} selected />);
    const button = screen.getByRole("button", { name: "Work, Monday 12:00 to 12:30 PM, blocked, selected" });
    expect(button.className).toContain("ring-accent");
  });

  it("can be picked with ⌘-click in drawing mode too", async () => {
    const user = userEvent.setup();
    const onToggleSelected = vi.fn();
    render(<BlockedTimeBlock {...work} density="regular" layout="line" style={{}} erasable onToggleSelected={onToggleSelected} />);
    const block = screen.getByRole("img");
    await user.click(block);
    expect(onToggleSelected).not.toHaveBeenCalled();
    await user.keyboard("{Meta>}");
    await user.click(block);
    await user.keyboard("{/Meta}");
    expect(onToggleSelected).toHaveBeenCalledOnce();
  });
});
