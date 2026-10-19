import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { getPlannerStore } from "@/lib/store";
import { resetPlanner, setPlanner } from "@/components/schedule/testing/plannerFixtures";
import { CheckAnotherTermButton } from "./CheckAnotherTermButton";

vi.mock("@/components/courses/useTermsWithCourse", () => ({
  useTermsWithCourse: () => [{ id: "2027-D", name: "D Term" }],
}));
afterEach(resetPlanner);

it.each([
  ["ready", "2027-D", "ready", true],
  ["failed", "2027-D", "error", false],
  ["superseded", "2026-B", "ready", false],
] as const)("adds the course only if the requested term is still ready: %s", async (_name, termId, termStatus, expected) => {
  let resolve!: () => void;
  const pending = new Promise<void>((done) => { resolve = done; });
  const addCourse = vi.fn();
  const setTerm = vi.fn(() => pending);
  setPlanner();
  getPlannerStore().setState({ addCourse, setTerm });
  render(<CheckAnotherTermButton code="AE 2320" />);
  await userEvent.click(screen.getByRole("button", { name: "Check another term for AE 2320: D Term" }));
  expect(setTerm).toHaveBeenCalledWith("2027-D");
  expect(addCourse).not.toHaveBeenCalled();
  await act(async () => {
    getPlannerStore().setState({ termId, termStatus });
    resolve();
    await pending;
  });
  expect(addCourse).toHaveBeenCalledTimes(expected ? 1 : 0);
  if (expected) expect(addCourse).toHaveBeenCalledWith("AE 2320");
});
