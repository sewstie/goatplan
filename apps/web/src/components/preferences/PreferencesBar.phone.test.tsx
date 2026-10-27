import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { polyfillDialog, startTestPlanner } from "@/components/sections/testing/plannerStore";
import { PreferencesBar } from "./PreferencesBar";

// Ticket 11, requirement 1: below 640px the Preferences controls wrap so that Sort and
// Starts-after each get a full row and the toggles share one row. The layout switch is driven by
// usePhoneViewport(), which reads window.matchMedia("(max-width: 39.99rem)"); the tests fake that
// query to pin the viewport to phone or tablet width.

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

/** The real matchMedia, so each test can put it back when it's done. */
const realMatchMedia = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
});

/** Reports every media query as matching the phone breakpoint (max-width: 39.99rem). */
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

/** Reports no query as matching, the tablet-and-wider layout. */
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

/** The Preferences group element that holds every control. */
function preferencesGroup() {
  return screen.getByRole("group", { name: "Preferences" });
}

/** Walks up from a control to the immediate child of the Preferences group that contains it: its "row". */
function rowWithin(group: HTMLElement, element: HTMLElement): HTMLElement {
  let node: HTMLElement = element;
  while (node.parentElement && node.parentElement !== group) {
    node = node.parentElement;
  }
  return node;
}

describe("PreferencesBar on a phone", () => {
  it("lets Starts-after take a full row of its own", async () => {
    mockPhoneViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const group = preferencesGroup();
    const startsAfter = screen.getByRole("combobox", { name: "Starts after" });
    const row = rowWithin(group, startsAfter);

    // Starts-after should not share its row with Sort or the toggles.
    expect(row).not.toContainElement(screen.getByRole("combobox", { name: "Sort" }));
    expect(row).not.toContainElement(screen.getByRole("switch", { name: "Only open sections" }));
    expect(row.className).toContain("w-full");
  });

  it("lets Sort take a full row of its own", async () => {
    mockPhoneViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const group = preferencesGroup();
    const sort = screen.getByRole("combobox", { name: "Sort" });
    const row = rowWithin(group, sort);

    expect(row).not.toContainElement(screen.getByRole("combobox", { name: "Starts after" }));
    expect(row).not.toContainElement(screen.getByRole("switch", { name: "Only open sections" }));
    expect(row.className).toContain("w-full");
  });

  it("keeps Starts-after and Sort in separate rows from each other", async () => {
    mockPhoneViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const group = preferencesGroup();
    const startsAfterRow = rowWithin(group, screen.getByRole("combobox", { name: "Starts after" }));
    const sortRow = rowWithin(group, screen.getByRole("combobox", { name: "Sort" }));

    expect(startsAfterRow).not.toBe(sortRow);
  });

  it("stacks the controls as a column so each full-width row sits on its own line", async () => {
    mockPhoneViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    expect(preferencesGroup().className).toContain("flex-col");
  });

  it("keeps the wide layout untouched on a tablet: one wrapping row, no forced column", async () => {
    mockTabletViewport();
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<PreferencesBar />);

    const group = preferencesGroup();
    expect(group.className).not.toContain("flex-col");
    // On a tablet Starts-after and Sort live in the same flex row, not boxed into full-width rows.
    const startsAfterRow = rowWithin(group, screen.getByRole("combobox", { name: "Starts after" }));
    expect(startsAfterRow.className).not.toContain("w-full");
  });
});
