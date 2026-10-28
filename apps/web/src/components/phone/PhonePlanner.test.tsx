import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePhoneScreen } from "./phoneScreen";

vi.mock("@/components/shell/Brand", () => ({ Brand: () => null }));
vi.mock("@/components/shell/DataUpdated", () => ({ DataUpdated: () => null }));
vi.mock("./PhoneTermSelect", () => ({ PhoneTermSelect: () => null }));
vi.mock("./PhoneSearchScreen", () => ({ PhoneSearchScreen: () => null }));
vi.mock("./PhonePreferencesScreen", () => ({ PhonePreferencesScreen: () => null }));
vi.mock("./PhoneCourseScreen", () => ({ PhoneCourseScreen: () => <p>Course screen</p> }));
vi.mock("./PhoneScheduleScreen", () => ({ PhoneScheduleScreen: () => <p>Schedule screen</p> }));

import { PhonePlanner } from "./PhonePlanner";

const scrollTo = vi.fn();

function scrollPageTo(top: number) {
  Object.defineProperty(window, "scrollY", { value: top, configurable: true });
  fireEvent.scroll(window);
}

beforeEach(() => {
  usePhoneScreen.setState({ screen: "schedule" });
  window.scrollTo = scrollTo as typeof window.scrollTo;
});

afterEach(() => {
  scrollTo.mockReset();
  scrollPageTo(0);
});

describe("PhonePlanner scrolling", () => {
  it("returns to where the schedule was left after a trip to course details", () => {
    render(<PhonePlanner banner={null} />);
    scrollPageTo(300);
    act(() => usePhoneScreen.getState().show("course"));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0 });
    scrollPageTo(0);
    act(() => usePhoneScreen.getState().show("schedule"));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 300 });
  });

  it("scrolls the course screen inside main and keeps the page from bouncing", () => {
    render(<PhonePlanner banner={null} />);
    act(() => usePhoneScreen.getState().show("course"));
    expect(screen.getByRole("main")).toHaveClass("overflow-y-auto");
    expect(document.documentElement.style.overscrollBehavior).toBe("none");
    act(() => usePhoneScreen.getState().show("schedule"));
    expect(screen.getByRole("main")).not.toHaveClass("overflow-y-auto");
    expect(document.documentElement.style.overscrollBehavior).toBe("");
  });
});
