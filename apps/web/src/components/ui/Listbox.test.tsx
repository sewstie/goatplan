import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { Listbox } from "./Listbox";

const options = [
  { value: "", label: "Any professor", description: "All 4 lecture times" },
  { value: "alex", label: "Alex Rivera", description: "3 lecture times · includes co-teaching" },
  { value: "jordan", label: "Jordan Kim", description: "1 co-taught lecture" },
  { value: "morgan", label: "Morgan Lee", description: "1 lecture time" },
];

function Field({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState("");
  return <><Listbox label="Lecture professor" options={options} value={value} onChange={setValue} disabled={disabled} /><button>Next field</button></>;
}

it("opens an associated listbox with the selected option and keeps focus on its combobox", async () => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox", { name: "Lecture professor" });
  expect(field).toHaveAttribute("aria-expanded", "false");
  await user.click(field);
  const popup = screen.getByRole("listbox", { name: "Lecture professor" });
  const selected = screen.getByRole("option", { name: "Any professor", selected: true });
  expect(field).toHaveAttribute("aria-controls", popup.id);
  expect(field).toHaveAttribute("aria-activedescendant", selected.id);
  expect(field).toHaveAttribute("aria-expanded", "true");
  expect(selected).toHaveAccessibleDescription("All 4 lecture times");
  expect(field).toHaveFocus();
  expect(screen.getAllByRole("option")).toHaveLength(4);
});

it.each(["{Enter}", " ", "{ArrowDown}", "{Alt>}{ArrowDown}{/Alt}"])("opens with %s, explores without changing the value, and commits with Enter", async (key) => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.tab();
  await user.keyboard(key);
  expect(screen.getByRole("listbox")).toBeInTheDocument();
  await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Alex Rivera" }).id);
  expect(screen.getByRole("option", { name: "Any professor" })).toHaveAttribute("aria-selected", "true");
  expect(field).toHaveTextContent("Any professor");
  await user.keyboard("{Enter}");
  expect(field).toHaveTextContent("Alex Rivera");
  expect(field).toHaveAttribute("aria-expanded", "false");
  expect(field).not.toHaveAttribute("aria-activedescendant");
  expect(field).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Alex Rivera", selected: true }).id);
});

it("jumps to both ends, stops at the edges and selects with Space", async () => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.tab();
  await user.keyboard("{End}{ArrowDown}");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Morgan Lee" }).id);
  await user.keyboard("{Home}{ArrowUp}");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Any professor" }).id);
  await user.keyboard("{End} ");
  expect(field).toHaveTextContent("Morgan Lee");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

it("searches names from the keyboard and cycles repeated initials without selecting", async () => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.tab();
  await user.keyboard("a");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Alex Rivera" }).id);
  await user.keyboard("a");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Any professor" }).id);
  await user.keyboard("lex");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Alex Rivera" }).id);
  expect(field).toHaveTextContent("Any professor");
  await user.keyboard("{Enter}");
  expect(field).toHaveTextContent("Alex Rivera");
});

it.each(["{Escape}", "{Tab}", "outside"])("dismisses with %s and leaves the chosen professor unchanged", async (action) => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.click(field);
  await user.keyboard("{End}");
  if (action === "outside") await user.click(screen.getByRole("button", { name: "Next field" }));
  else await user.keyboard(action);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(field).toHaveAttribute("aria-expanded", "false");
  expect(field).toHaveTextContent("Any professor");
  expect(action === "{Escape}" ? field : screen.getByRole("button", { name: "Next field" })).toHaveFocus();
});

it("starts a fresh name search after reopening or navigating", async () => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.tab();
  await user.keyboard("alex{Enter}m");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Morgan Lee" }).id);
  await user.keyboard("{Home}j");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Jordan Kim" }).id);
});

it("keeps the chosen option active when a new search has no matching name", async () => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.click(field);
  await user.keyboard("{End}{Escape}z");
  expect(field).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Any professor", selected: true }).id);
  await user.keyboard("{Enter}");
  expect(field).toHaveTextContent("Any professor");
});

it("selects and clears with the pointer while returning focus to the combobox", async () => {
  const user = userEvent.setup();
  render(<Field />);
  const field = screen.getByRole("combobox");
  await user.click(field);
  await user.click(screen.getByRole("option", { name: "Jordan Kim" }));
  expect(field).toHaveTextContent("Jordan Kim");
  expect(field).toHaveFocus();
  await user.click(field);
  expect(screen.getByRole("option", { name: "Jordan Kim" })).toHaveAttribute("aria-selected", "true");
  await user.click(screen.getByRole("option", { name: "Any professor" }));
  expect(field).toHaveTextContent("Any professor");
  expect(field).toHaveFocus();
});

it("cannot open a disabled field and skips it when tabbing", async () => {
  const user = userEvent.setup();
  render(<Field disabled />);
  await user.click(screen.getByRole("combobox"));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  await user.tab();
  expect(screen.getByRole("button", { name: "Next field" })).toHaveFocus();
});
