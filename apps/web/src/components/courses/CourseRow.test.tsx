import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CourseRow } from "./CourseRow";
import { PhoneDetailsProvider } from "@/components/shell/phoneDetails";

function row(overrides: Partial<Parameters<typeof CourseRow>[0]> = {}) {
  return (
    <ul>
      <CourseRow
        code="AE 2320"
        title="Introduction to Orbital Mechanics"
        sections="CL01 · CX01"
        swatch="bg-course-2-swatch"
        locked={false}
        selected={false}
        onSelect={() => {}}
        onRemove={() => {}}
        {...overrides}
      />
    </ul>
  );
}

describe("CourseRow", () => {
  it("calls onSelect and opens the phone details when inside a provider", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    const { container } = render(
      <PhoneDetailsProvider onOpen={onOpen}>{row({ onSelect })}</PhoneDetailsProvider>,
    );
    await user.click(container.querySelector<HTMLElement>('[data-course-row="AE 2320"]')!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("only calls onSelect when there's no phone details provider", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(row({ onSelect }));
    await user.click(container.querySelector<HTMLElement>('[data-course-row="AE 2320"]')!);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove from the remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(row({ onRemove }));
    await user.click(screen.getByRole("button", { name: "Remove AE 2320" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
