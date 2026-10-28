import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { polyfillDialog, startTestPlanner, waitForSolve } from "@/components/sections/testing/plannerStore";
import { PhonePreferenceChips } from "./PhonePreferenceChips";
import { usePhoneScreen } from "./phoneScreen";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

afterEach(() => usePhoneScreen.setState({ screen: "schedule" }));

describe("PhonePreferenceChips", () => {
  it("shows the start time short and changes it from the phone picker", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"], preferences: { startsAfter: 540, blocked: [], onlyOpen: true } });
    render(<PhonePreferenceChips />);

    expect(screen.getByText("After 9 AM")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Starts after"), "600");
    await waitForSolve(store);
    expect(store.getState().preferences.startsAfter).toBe(600);
    expect(screen.getByText("After 10 AM")).toBeInTheDocument();
  });

  it("opens the Preferences screen from a blocked-time chip", async () => {
    await startTestPlanner({
      courses: ["AE 2320"],
      preferences: { startsAfter: 0, blocked: [{ day: "Tue", start: 840, end: 960, label: "Work" }], onlyOpen: true },
    });
    render(<PhonePreferenceChips />);

    expect(screen.getByText("Any time", { selector: "span" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Blocked Work, Tue 2 PM–4 PM. Edit in preferences" }));
    expect(screen.getByText("Tue 2 PM–4 PM")).toBeInTheDocument();
    expect(usePhoneScreen.getState().screen).toBe("preferences");
  });

  it("turns Only open sections off from its pill", async () => {
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<PhonePreferenceChips />);

    await userEvent.click(screen.getByRole("switch", { name: "Only open sections" }));
    await waitForSolve(store);
    expect(store.getState().preferences.onlyOpen).toBe(false);
  });
});
