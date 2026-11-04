import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DEGREE_FLAG_KEY } from "@/lib/flags";
import { DegreeGate } from "./DegreeGate";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

afterEach(() => {
  localStorage.clear();
  replace.mockClear();
});

it("renders nothing inside it and goes to the planner without the flag", () => {
  render(<DegreeGate><p>Inside</p></DegreeGate>);
  expect(screen.queryByText("Inside")).toBeNull();
  expect(replace).toHaveBeenCalledWith("/");
});

it("shows what's inside with the flag", () => {
  localStorage.setItem(DEGREE_FLAG_KEY, "on");
  render(<DegreeGate><p>Inside</p></DegreeGate>);
  expect(screen.getByText("Inside")).toBeVisible();
  expect(replace).not.toHaveBeenCalled();
});
