import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { usePointerFocus } from "./usePointerFocus";

function Grid() {
  const focus = usePointerFocus<HTMLDivElement>();
  return (
    <>
      <button type="button">Before</button>
      <div role="group" aria-label="Grid" tabIndex={0} data-pointer-focus={focus.byPointer || undefined} {...focus.handlers}>
        <button type="button">Block</button>
      </div>
    </>
  );
}

const grid = () => screen.getByRole("group", { name: "Grid" });

it("marks focus from a click, so the grid can skip its ring", () => {
  render(<Grid />);
  fireEvent.pointerDown(grid());
  act(() => grid().focus());
  fireEvent.pointerUp(grid());
  expect(grid()).toHaveAttribute("data-pointer-focus");
});

it("leaves focus from the keyboard unmarked, even after an earlier click", () => {
  render(<Grid />);
  fireEvent.pointerDown(grid());
  act(() => grid().focus());
  fireEvent.pointerUp(grid());
  act(() => screen.getByRole("button", { name: "Before" }).focus());
  expect(grid()).not.toHaveAttribute("data-pointer-focus");
  act(() => grid().focus());
  expect(grid()).not.toHaveAttribute("data-pointer-focus");
});

it("hides the ring when the grid, already focused from the keyboard, is clicked", () => {
  render(<Grid />);
  act(() => grid().focus());
  expect(grid()).not.toHaveAttribute("data-pointer-focus");
  fireEvent.pointerDown(grid());
  expect(grid()).toHaveAttribute("data-pointer-focus");
});

it("doesn't carry a click on a block over to the grid's next focus", () => {
  render(<Grid />);
  const block = screen.getByRole("button", { name: "Block" });
  fireEvent.pointerDown(block);
  act(() => block.focus());
  fireEvent.pointerUp(block);
  act(() => grid().focus());
  expect(grid()).not.toHaveAttribute("data-pointer-focus");
});
