import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Listbox, type ListboxVariant } from "./Listbox";

const options = [
  { value: "", label: "Any professor", description: "All 4 lecture times" },
  { value: "alex", label: "Alex Rivera", description: "3 lecture times · includes co-teaching" },
  { value: "jordan", label: "Jordan Kim", description: "1 co-taught lecture" },
  { value: "morgan", label: "Morgan Lee", description: "1 lecture time" },
];

function Field({ disabled = false, variant }: { disabled?: boolean; variant?: ListboxVariant }) {
  const [value, setValue] = useState("");
  return <><Listbox label="Lecture professor" options={options} value={value} onChange={setValue} disabled={disabled} variant={variant} /><button>Next field</button></>;
}

function MenuField({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState("best");
  const sortOptions = [
    { value: "best", label: "Best overall" },
    { value: "fewest-early", label: "Fewest early" },
    { value: "latest", label: "Latest start" },
  ];
  return <><Listbox label="Sort" menuLabel="Sort" options={sortOptions} value={value} onChange={setValue} disabled={disabled} variant="menu" /><button>Next field</button></>;
}

// ── Field variant (default) ───────────────────────────────────────────

describe("field variant", () => {
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
});

// ── Menu variant ──────────────────────────────────────────────────────

describe("menu variant", () => {
  it("renders with the menu label and the current value", () => {
    render(<MenuField />);
    const trigger = screen.getByRole("combobox", { name: "Sort" });
    expect(trigger).toHaveTextContent("Sort");
    expect(trigger).toHaveTextContent("Best overall");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the listbox and the same keyboard behavior applies", async () => {
    const user = userEvent.setup();
    render(<MenuField />);
    const trigger = screen.getByRole("combobox", { name: "Sort" });
    await user.click(trigger);
    expect(screen.getByRole("listbox", { name: "Sort" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(trigger).toHaveTextContent("Fewest early");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])("opens with %s", async (key) => {
    const user = userEvent.setup();
    render(<MenuField />);
    await user.tab();
    await user.keyboard(key);
    expect(screen.getByRole("listbox", { name: "Sort" })).toBeInTheDocument();
  });

  it("dismisses with Escape and does not change the value", async () => {
    const user = userEvent.setup();
    render(<MenuField />);
    const trigger = screen.getByRole("combobox", { name: "Sort" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Best overall");
    expect(trigger).toHaveFocus();
  });

  it("dismisses with Tab, moving focus forward", async () => {
    const user = userEvent.setup();
    render(<MenuField />);
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.keyboard("{Tab}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next field" })).toHaveFocus();
  });

  it("dismisses on outside click", async () => {
    const user = userEvent.setup();
    render(<MenuField />);
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await user.click(screen.getByRole("button", { name: "Next field" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  describe("list position", () => {
    // jsdom has no layout: the trigger and the list report these boxes, in a 1024 × 768 window.
    let triggerBox: DOMRect;
    const listWidth = 180;
    beforeEach(() => {
      triggerBox = new DOMRect(700, 100, 146, 28);
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute("role") === "combobox") return triggerBox;
        if (this.getAttribute("role") === "listbox") return new DOMRect(0, 0, listWidth, 300);
        return new DOMRect();
      });
    });
    afterEach(() => vi.restoreAllMocks());

    it("opens below the menu trigger, lined up with its right edge", async () => {
      const user = userEvent.setup();
      render(<MenuField />);
      await user.click(screen.getByRole("combobox", { name: "Sort" }));
      const list = screen.getByRole("listbox", { name: "Sort" });
      expect(list.style.left).toBe(`${700 + 146 - listWidth}px`);
      expect(list.style.top).toBe("128px");
      expect(list.style.minWidth).toBe("146px");
    });

    it("shifts to stay 8 px inside the window and flips above when there's no room below", async () => {
      triggerBox = new DOMRect(20, 700, 146, 28);
      const user = userEvent.setup();
      render(<MenuField />);
      await user.click(screen.getByRole("combobox", { name: "Sort" }));
      const list = screen.getByRole("listbox", { name: "Sort" });
      expect(list.style.left).toBe("8px");
      expect(list.style.top).toBe(`${700 - 300}px`);
    });

    it("keeps the field variant's list lined up with its left edge", async () => {
      const user = userEvent.setup();
      render(<Field />);
      await user.click(screen.getByRole("combobox", { name: "Lecture professor" }));
      expect(screen.getByRole("listbox", { name: "Lecture professor" }).style.left).toBe("700px");
    });
  });
});

// ── Hover highlight ───────────────────────────────────────────────────

describe("hover highlight", () => {
  it("moves the highlight on pointer hover (field variant)", async () => {
    const user = userEvent.setup();
    render(<Field />);
    await user.click(screen.getByRole("combobox"));
    const jordan = screen.getByRole("option", { name: "Jordan Kim" });
    await user.hover(jordan);
    const field = screen.getByRole("combobox");
    expect(field).toHaveAttribute("aria-activedescendant", jordan.id);
  });

  it("moves the highlight on pointer hover (menu variant)", async () => {
    const user = userEvent.setup();
    render(<MenuField />);
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    const option = screen.getByRole("option", { name: "Latest start" });
    await user.hover(option);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", option.id);
  });

  it("arrow keys move the highlight after a pointer hover", async () => {
    const user = userEvent.setup();
    render(<Field />);
    await user.click(screen.getByRole("combobox"));
    await user.hover(screen.getByRole("option", { name: "Jordan Kim" }));
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Morgan Lee" }).id,
    );
  });

  it.each([["field", Field], ["menu", MenuField]] as const)("the highlighted selected option keeps its accent fill (%s variant)", async (_, Component) => {
    const user = userEvent.setup();
    render(<Component />);
    const field = screen.getByRole("combobox");
    await user.click(field);
    // Opening highlights the selected option: it keeps the soft accent fill, not the highlight fill.
    const selected = screen.getByRole("option", { selected: true });
    expect(field).toHaveAttribute("aria-activedescendant", selected.id);
    expect(selected).toHaveClass("bg-accent-soft", "text-accent");
    expect(selected).not.toHaveClass("bg-surface-selected");

    const other = screen.getAllByRole("option", { selected: false })[0];
    await user.hover(other);
    expect(other).toHaveClass("bg-surface-selected");
    expect(selected).toHaveClass("bg-accent-soft");

    await user.hover(selected);
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveClass("bg-accent-soft");
    expect(selected).not.toHaveClass("bg-surface-selected");
    expect(other).not.toHaveClass("bg-surface-selected");
  });
});

// ── Accessibility: roles and names ────────────────────────────────────

describe("accessibility", () => {
  it("the trigger is a combobox with label, haspopup, expanded, and controls", () => {
    render(<Field />);
    const trigger = screen.getByRole("combobox", { name: "Lecture professor" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("the list is a listbox with the correct label and the selected option is marked", async () => {
    const user = userEvent.setup();
    render(<Field />);
    await user.click(screen.getByRole("combobox"));
    const listbox = screen.getByRole("listbox", { name: "Lecture professor" });
    expect(listbox).toBeInTheDocument();
    const selected = screen.getByRole("option", { name: "Any professor", selected: true });
    expect(selected).toBeInTheDocument();
    const unselected = screen.getByRole("option", { name: "Alex Rivera", selected: false });
    expect(unselected).toBeInTheDocument();
  });

  it("menu variant trigger is a combobox with its label", () => {
    render(<MenuField />);
    const trigger = screen.getByRole("combobox", { name: "Sort" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("activedescendant tracks the highlighted option", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Any professor" }).id);
    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Alex Rivera" }).id);
  });

  it("activedescendant is cleared when the list closes", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).not.toHaveAttribute("aria-activedescendant");
  });
});
