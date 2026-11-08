import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ClassBlock } from "./ClassBlock";
import type { ClassItem } from "./scheduleItems";

const item: ClassItem = {
  key: "AE 2320-CL01-Mon", courseCode: "AE 2320", title: "Introduction to Orbital Mechanics", sectionId: "AE 2320-CL01",
  sectionCode: "CL01", instructors: ["Ye Lu"], slot: 1, locked: false, day: "Mon", start: 540, end: 590, location: "Unity Hall 400",
};

function block(selected: boolean) {
  render(<ClassBlock item={item} density="regular" style={{}} selected={selected} onSelect={() => {}} />);
  return screen.getByRole("button", { name: /^AE 2320 CL01,/ });
}

it("keeps the course color on a phone and gives a selected block a dashed outline from the tablet breakpoint up", () => {
  const { className } = block(true);
  const classes = className.split(" ");
  expect(classes).toEqual(expect.arrayContaining(["bg-course-1", "tablet:bg-surface-raised", "tablet:border-dashed", "tablet:border-ink-muted", "tablet:hover:border-ink-muted"]));
  expect(className).not.toMatch(/border-accent|shadow-selected/);
  expect(classes).not.toContain("border-dashed");
  expect(classes).not.toContain("bg-surface-raised");
});

it("has no selected outline when not selected", () => {
  expect(block(false).className).not.toMatch(/border-dashed|border-ink-muted/);
});

it("fits a short section on one line, with everything still in its label", () => {
  render(<ClassBlock item={{ ...item, end: 570 }} density="regular" layout="line" style={{}} selected={false} onSelect={() => {}} />);
  const button = screen.getByRole("button", { name: "AE 2320 CL01, Introduction to Orbital Mechanics, Monday, 9:00 AM–9:30 AM, Unity Hall 400, Ye Lu" });
  expect(button).toHaveTextContent(/^AE 2320 · 9–9:30$/);
});

it("names itself on hover, for a block too narrow to show any text, without saying it twice to a screen reader", () => {
  const button = block(false);
  expect(button).not.toHaveAttribute("title");
  expect(button.querySelector("[title]")).toHaveAttribute("title", button.getAttribute("aria-label"));
  expect(button.querySelector("[title]")).toHaveAttribute("aria-hidden", "true");
});

it("shows only the color when not even one line fits", () => {
  render(<ClassBlock item={{ ...item, end: 560 }} density="compact" layout="none" style={{}} selected={false} onSelect={() => {}} />);
  expect(screen.getByRole("button", { name: /^AE 2320 CL01,/ })).toHaveTextContent(/^$/);
});

it("doesn't show its details on a click in drawing mode, but does from the keyboard", async () => {
  const onSelect = vi.fn();
  render(<ClassBlock item={item} density="regular" style={{}} selected={false} onSelect={onSelect} drawing />);
  const button = screen.getByRole("button", { name: /^AE 2320 CL01,/ });
  await userEvent.click(button);
  expect(onSelect).not.toHaveBeenCalled();
  expect(button.className).toContain("cursor-crosshair");

  button.focus();
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledOnce();
});

it("keeps a room's number apart from its building, so a narrow block can't cut it off", () => {
  render(<ClassBlock item={{ ...item, location: "Gordon Library 208 Art Studio" }} density="regular" style={{}} selected={false} onSelect={() => {}} />);
  const number = screen.getByText("208");
  expect(number.className).toContain("shrink-0");
  expect(screen.getByText("Gordon Library").className).toContain("truncate");
});

it("says whether a keyboard or a mouse picked it", async () => {
  const onSelect = vi.fn();
  render(<ClassBlock item={item} density="regular" style={{}} selected={false} onSelect={onSelect} />);
  const button = screen.getByRole("button", { name: /^AE 2320 CL01,/ });
  await userEvent.click(button);
  expect(onSelect).toHaveBeenLastCalledWith(item, false);
  button.focus();
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenLastCalledWith(item, true);
});
