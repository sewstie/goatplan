import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
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

it("keeps the course color on a phone and lifts a selected block from the tablet breakpoint up, without a blue outline", () => {
  const { className } = block(true);
  const classes = className.split(" ");
  expect(classes).toEqual(expect.arrayContaining(["bg-course-1", "tablet:bg-surface-raised", "tablet:shadow-block-hover"]));
  expect(className).not.toMatch(/border-accent|shadow-selected/);
  expect(classes).not.toContain("bg-surface-raised");
});

it("has no selected outline when not selected", () => {
  expect(block(false).className).not.toMatch(/border-accent|shadow-selected/);
});
