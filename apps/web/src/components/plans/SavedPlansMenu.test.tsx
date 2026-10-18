import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { designPlan } from "@/lib/plans/testing";
import { SavedPlansMenu } from "./SavedPlansMenu";

vi.mock("next/navigation", () => ({ usePathname: () => "/plans" }));
vi.mock("next/link", () => ({
  default: ({ href, ...rest }: ComponentProps<"a"> & { href: string }) => <a href={href} {...rest} />,
}));

function renderMenu(props: Partial<ComponentProps<typeof SavedPlansMenu>> = {}) {
  const plans = [designPlan(), designPlan({ id: "plan-2", name: "Mornings free" })];
  const handlers = { onOpenPlan: vi.fn(), onSaveAsNew: vi.fn() };
  render(
    <>
      <SavedPlansMenu
        plans={plans}
        termName="C Term · Spring 2027"
        currentPlan={plans[0]}
        disabled={false}
        canSaveAsNew
        {...handlers}
        {...props}
      />
      <button type="button">Elsewhere</button>
    </>,
  );
  return { ...handlers, trigger: screen.getByRole("button", { name: "Saved plans" }) };
}

describe("SavedPlansMenu", () => {
  it("opens and closes with its button and lists the term's plans", async () => {
    const { trigger } = renderMenu();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("list", { name: "Saved plans for C Term · Spring 2027" });
    expect(list).toHaveTextContent("Plan 13 courses · 4 sections(open now)");
    expect(screen.getByRole("link", { name: "Sections to register" })).toHaveAttribute("href", "/plans?plan=plan-1");
    expect(screen.getByRole("link", { name: "All saved plans" })).toHaveAttribute("href", "/plans");
    expect(screen.getByRole("link", { name: "Back to planner" })).toHaveAttribute("href", "/");
    await userEvent.click(trigger);
    expect(screen.queryByRole("list", { name: /Saved plans for/ })).not.toBeInTheDocument();
  });

  it("closes with Escape and gives focus back to its button", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: /Plan 1/ })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes when focus or a click goes elsewhere", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a plan or saves a copy, then closes", async () => {
    const { trigger, onOpenPlan, onSaveAsNew } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: /Mornings free/ }));
    expect(onOpenPlan).toHaveBeenCalledWith(expect.objectContaining({ id: "plan-2" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Save as a new plan" }));
    expect(onSaveAsNew).toHaveBeenCalled();
  });

  it("says when the term has no plans, and can't open while the term loads", async () => {
    const { trigger } = renderMenu({ plans: [], currentPlan: null, canSaveAsNew: false });
    await userEvent.click(trigger);
    expect(screen.getByText("No saved plans for C Term · Spring 2027 yet.")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Sections to register" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save as a new plan" })).not.toBeInTheDocument();
  });

  it("is disabled while the term loads", () => {
    const { trigger } = renderMenu({ disabled: true });
    expect(trigger).toBeDisabled();
  });
});
