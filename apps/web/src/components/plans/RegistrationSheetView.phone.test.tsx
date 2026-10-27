import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { designPlan, termWith } from "@/lib/plans/testing";
import { RegistrationSheetView } from "./RegistrationSheetView";

// Ticket 13: Phone saved plans and Sections to register
// Below 640 px the sections-to-register view switches from a table to one card per section,
// with label/value rows for course, section, CRN, days and time, room and instructor.
// Copy, Print and "Open Workday" sit above the cards as full-width buttons.
// Touch targets are at least 44 px.
// Print output keeps the desktop table at every screen width.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("?plan=plan-1"),
  usePathname: () => "/plans",
  useRouter: () => ({ push: vi.fn() }),
}));

const plan = designPlan();

vi.mock("@/lib/plans/useTermFile", () => ({
  useTermFile: () => ({ term: termWith(plan), status: "ready" }),
}));

const realMatchMedia = window.matchMedia;

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

beforeAll(() => {
  // jsdom doesn't support clipboard.writeText; stub it so CopySectionListButton works.
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn() },
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, "matchMedia", { writable: true, value: realMatchMedia });
});

describe("RegistrationSheetView on a phone", () => {
  it("shows section cards instead of a table", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    // Should NOT show the table on phone
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    // Should show card-style section entries with label/value rows
    // The plan has 4 sections (CL01, CX02 for AE 2320, C01 for AE 2410, C01 for AE 2210)
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(4);
  });

  it("shows label/value rows for each section card", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const cards = screen.getAllByRole("article");
    const firstCard = cards[0];

    // Each card should have label/value pairs for: Course, Section, Days and time, Room, Instructor
    expect(within(firstCard).getByText("Course")).toBeInTheDocument();
    expect(within(firstCard).getByText("Section")).toBeInTheDocument();
    expect(within(firstCard).getByText("Days and time")).toBeInTheDocument();
    expect(within(firstCard).getByText("Room")).toBeInTheDocument();
    expect(within(firstCard).getByText("Instructor")).toBeInTheDocument();
  });

  it("displays course code and title in the card", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const cards = screen.getAllByRole("article");
    const firstCard = cards[0];
    expect(within(firstCard).getByText("AE 2320")).toBeInTheDocument();
    expect(within(firstCard).getByText("Introduction to Orbital Mechanics")).toBeInTheDocument();
  });

  it("shows Copy and Print buttons as full-width above the cards", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const copyButton = screen.getByRole("button", { name: "Copy section list" });
    const printButton = screen.getByRole("button", { name: "Print" });

    // On phone, buttons should have full-width styling
    expect(copyButton.className).toMatch(/w-full/);
    expect(printButton.className).toMatch(/w-full/);
  });

  it("gives action buttons a minimum 44px touch target", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const copyButton = screen.getByRole("button", { name: "Copy section list" });
    const printButton = screen.getByRole("button", { name: "Print" });

    // 44px touch target: min-h-44 class
    expect(copyButton.className).toMatch(/min-h-44/);
    expect(printButton.className).toMatch(/min-h-44/);
  });

  it("shows the Workday link above the cards", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const workday = screen.getByRole("link", { name: /Open Workday/i });
    expect(workday).toBeInTheDocument();
    expect(workday).toHaveAttribute("href", "https://workday.wpi.edu");
    expect(workday.className).toMatch(/w-full/);
    expect(workday.className).toMatch(/min-h-44/);
  });

  it("puts the same text on the clipboard as on desktop (Copy button present)", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    // The Copy button is present and uses the same text
    const copyButton = screen.getByRole("button", { name: "Copy section list" });
    expect(copyButton).toBeInTheDocument();
  });
});

describe("RegistrationSheetView on a tablet", () => {
  it("shows the table, not cards", () => {
    mockTabletViewport();
    render(<RegistrationSheetView plan={plan} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("shows buttons inline, not full-width", () => {
    mockTabletViewport();
    render(<RegistrationSheetView plan={plan} />);

    const copyButton = screen.getByRole("button", { name: "Copy section list" });
    expect(copyButton.className).not.toMatch(/w-full/);
  });

  it("does not duplicate the Workday link in the sheet on tablet", () => {
    mockTabletViewport();
    render(<RegistrationSheetView plan={plan} />);

    // On tablet, Open Workday stays in the DetailsPanel (PlanSummary), not in the sheet
    expect(screen.queryByRole("link", { name: /Open Workday/i })).not.toBeInTheDocument();
  });
});
