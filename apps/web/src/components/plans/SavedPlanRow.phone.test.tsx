import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { designPlan, termWith } from "@/lib/plans/testing";
import { SavedPlanRow } from "./SavedPlanRow";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) => <a href={href} {...rest}>{children}</a>,
}));

const realMatchMedia = window.matchMedia;

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 39.99rem)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => {
  Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
});

it("shows a phone plan as a short card: two actions, Rename and Delete as labelled icons, no note when nothing changed", async () => {
  const plan = designPlan();
  const onRename = vi.fn();
  const onDelete = vi.fn();
  render(
    <ul>
      <SavedPlanRow plan={plan} data={{ term: termWith(plan), status: "ready" }} isOpen disabled={false} onOpen={vi.fn()} onRename={onRename} onDelete={onDelete} />
    </ul>,
  );
  const row = within(screen.getByRole("listitem"));

  expect(row.getByRole("link", { name: /^Sections to register\s*Plan 1$/ })).toHaveAttribute("href", `/plans?plan=${plan.id}`);
  expect(row.getByRole("button", { name: /^Open in planner\s*Plan 1$/ })).toBeInTheDocument();
  expect(row.getByText("In the planner")).toBeInTheDocument();
  expect(row.queryByText("No changes since you saved.")).not.toBeInTheDocument();

  await userEvent.click(row.getByRole("button", { name: `Rename ${plan.name}` }));
  await userEvent.click(row.getByRole("button", { name: `Delete ${plan.name}` }));
  expect(onRename).toHaveBeenCalledOnce();
  expect(onDelete).toHaveBeenCalledOnce();
});
