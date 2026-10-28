import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { startTestPlanner } from "@/components/sections/testing/plannerStore";
import { PhoneTermSelect } from "./PhoneTermSelect";
import { usePhoneScreen } from "./phoneScreen";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

afterEach(() => usePhoneScreen.setState({ screen: "schedule" }));

it("lets the term change on the schedule screen but not on a course's details", async () => {
  await startTestPlanner({ courses: ["AE 2320"] });
  render(<PhoneTermSelect />);
  expect(screen.getByRole("combobox", { name: "Term" })).toBeInTheDocument();

  act(() => usePhoneScreen.getState().show("course"));
  expect(screen.queryByRole("combobox", { name: "Term" })).not.toBeInTheDocument();
  expect(screen.getByText("2027-C 2027")).toHaveTextContent("Term: 2027-C 2027");

  act(() => usePhoneScreen.getState().show("schedule"));
  expect(screen.getByRole("combobox", { name: "Term" })).toBeInTheDocument();
});
