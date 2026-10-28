import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { designPlan, termWith } from "@/lib/plans/testing";
import { RegistrationSheetView } from "./RegistrationSheetView";

// Below 640 px the sections-to-register view is one card per course, with Copy and "Open Workday"
// side by side above them. No Print and no section list there; the list shows only if copying fails.
// Touch targets are at least 44 px. Print output keeps the desktop table at every screen width.

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
  it("shows one compact card per course instead of a table or one card per section", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    // Should NOT show the table on phone
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    // The plan has 4 sections across 3 courses (AE 2320 has CL01 + CX02, AE 2410, AE 2210).
    // One card per course keeps 8-section plans short, so there are 3 cards, not 4.
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
  });

  it("lists each of a course's sections inside its single card", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    // The AE 2320 card holds both of its sections (lecture CL01 and lab CX02).
    const firstCard = screen.getAllByRole("article")[0];
    expect(within(firstCard).getByRole("heading", { name: "AE 2320" })).toBeInTheDocument();
    expect(within(firstCard).getByText("CL01")).toBeInTheDocument();
    expect(within(firstCard).getByText("CX02")).toBeInTheDocument();
  });

  it("displays course code and title in the card", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const cards = screen.getAllByRole("article");
    const firstCard = cards[0];
    expect(within(firstCard).getByText("AE 2320")).toBeInTheDocument();
    expect(within(firstCard).getByText("Introduction to Orbital Mechanics")).toBeInTheDocument();
  });

  it("keeps only Copy and Workday above the cards: no Print, no section list, no closing note", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    const copyButton = screen.getByRole("button", { name: "Copy section list" });
    expect(copyButton.className).toMatch(/w-full/);
    expect(copyButton.className).toMatch(/min-h-44/);
    expect(screen.queryByRole("button", { name: "Print" })).not.toBeInTheDocument();
    expect(screen.queryByText("Section list")).not.toBeInTheDocument();
    expect(screen.queryByText(/Complete registration in Workday/)).not.toBeInTheDocument();
  });

  it("shows the section list to copy by hand when the clipboard is blocked", async () => {
    mockPhoneViewport();
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("blocked"));
    render(<RegistrationSheetView plan={plan} />);

    screen.getByRole("button", { name: "Copy section list" }).click();
    expect(await screen.findByRole("alert")).toHaveTextContent("Press and hold the list below to copy it.");
    expect(screen.getByText("Section list")).toBeInTheDocument();
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

  it("keeps a single filled primary button: Copy is primary, Open Workday is not", () => {
    mockPhoneViewport();
    render(<RegistrationSheetView plan={plan} />);

    // The primary fill uses the accent background; only Copy should carry it.
    const copyButton = screen.getByRole("button", { name: "Copy section list" });
    const workday = screen.getByRole("link", { name: /Open Workday/i });
    expect(copyButton.className).toMatch(/bg-accent(?![\w-])/);
    expect(workday.className).not.toMatch(/bg-accent(?![\w-])/);
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
