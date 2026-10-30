import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { polyfillDialog, startTestPlanner } from "@/components/sections/testing/plannerStore";
import { DrawingBar } from "@/components/schedule/DrawingBar";
import { AddBlockedTimeButton } from "./AddBlockedTimeButton";
import { BlockTimeButton } from "./BlockTimeButton";

// Ticket 11, requirement 2: on a phone the "Block a time" form is a bottom Sheet; on a tablet and
// wider it is the centered Dialog. The Sheet and Dialog both render a <dialog> with the accessible
// name "Block a time", so the tests tell them apart by the bottom-sheet classes the phone sheet
// carries (full width, bottom-rounded, slides up) versus the centered-dialog classes.

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

const realMatchMedia = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
});

function mockPhoneViewport() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 39.99rem)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function mockTabletViewport() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/** The <dialog> element behind the "Block a time" surface, whichever surface it is. */
function blockDialog(): HTMLDialogElement {
  return screen.getByRole("dialog", { name: "Block a time" }).closest("dialog")!;
}

describe("The Preferences screen's Add on a phone", () => {
  it("opens a bottom sheet instead of the centered dialog", async () => {
    mockPhoneViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<AddBlockedTimeButton />);

    await userEvent.click(screen.getByRole("button", { name: "Add a blocked time" }));

    const surface = blockDialog();
    // The bottom sheet spans the screen width and is rounded only along its top edge.
    expect(surface.className).toContain("w-full");
    expect(surface.className).toContain("rounded-t-panel");
    // It is not the centered message dialog, which centers itself with m-auto.
    expect(surface.className).not.toContain("m-auto");
  });

  it("does not focus the optional name field, so the keyboard stays down", async () => {
    mockPhoneViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<AddBlockedTimeButton />);

    await userEvent.click(screen.getByRole("button", { name: "Add a blocked time" }));

    expect(screen.getByRole("textbox", { name: "Name (optional)" })).not.toHaveFocus();
  });

  it("still blocks a time from the sheet's form", async () => {
    mockPhoneViewport();
    const { store } = await startTestPlanner({ courses: ["AE 2320"] });
    render(<AddBlockedTimeButton />);

    await userEvent.click(screen.getByRole("button", { name: "Add a blocked time" }));
    const sheet = screen.getByRole("dialog", { name: "Block a time" });
    await userEvent.click(within(sheet).getByRole("checkbox", { name: "Monday" }));
    await userEvent.selectOptions(within(sheet).getByRole("combobox", { name: "From" }), "10:00 AM");
    await userEvent.selectOptions(within(sheet).getByRole("combobox", { name: "To" }), "11:30 AM");
    await userEvent.click(within(sheet).getByRole("button", { name: "Block time" }));

    expect(store.getState().preferences.blocked).toEqual([{ day: "Mon", start: 600, end: 690 }]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Type a time instead on a tablet and wider", () => {
  it("opens the centered dialog, not a bottom sheet", async () => {
    mockTabletViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<><BlockTimeButton /><DrawingBar /></>);

    await userEvent.click(screen.getByRole("button", { name: "Block a time" }));
    await userEvent.click(screen.getByRole("button", { name: "Type a time instead" }));

    const surface = blockDialog();
    // The centered dialog centers itself and is not the full-width, top-rounded bottom sheet.
    expect(surface.className).toContain("m-auto");
    expect(surface.className).not.toContain("rounded-t-panel");
  });
});
