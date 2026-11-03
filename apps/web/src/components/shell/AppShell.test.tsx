import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEGREE_FLAG_KEY } from "@/lib/flags";
import { AppShell } from "./AppShell";

function parts() {
  return {
    sidebar: <div data-testid="sidebar">sidebar</div>,
    header: <header>header</header>,
    toolbar: <div data-testid="toolbar">toolbar</div>,
    banner: <div data-testid="banner">banner</div>,
    schedule: <div data-testid="schedule">schedule</div>,
  };
}

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

describe("AppShell", () => {
  it("renders the sidebar, header, toolbar, banner and schedule", () => {
    render(<AppShell {...parts()} />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("header")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("Weekly schedule")).toBeInTheDocument();
  });

  it("shows no lone tab while My degree is hidden", () => {
    render(<AppShell {...parts()} />);
    expect(screen.queryByRole("navigation", { name: "Main" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Planner" })).not.toBeInTheDocument();
  });

  it("shows both tabs once My degree is on", () => {
    localStorage.setItem(DEGREE_FLAG_KEY, "on");
    render(<AppShell {...parts()} />);
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "My degree" })).toBeInTheDocument();
    localStorage.removeItem(DEGREE_FLAG_KEY);
  });

  it("puts the actions in the top bar", () => {
    render(<AppShell {...parts()} barActions={<p>actions</p>} />);
    const bar = screen.getAllByRole("banner")[0];
    expect(bar).toHaveTextContent("actions");
  });

  it("uses a phone side gutter that drops away at the tablet breakpoint", () => {
    const { container } = render(<AppShell {...parts()} />);
    const shell = container.querySelector("div.mx-auto");
    expect(shell).toHaveClass("px-(--size-phone-gutter)", "tablet:px-20");
  });

  it("omits the details panel when no details are given", () => {
    render(<AppShell {...parts()} details={undefined} />);
    expect(screen.queryByLabelText("Course details")).not.toBeInTheDocument();
  });

  it("shows the details panel when details are given", () => {
    render(<AppShell {...parts()} details={<p>details</p>} />);
    expect(screen.getByLabelText("Course details")).toBeInTheDocument();
  });
});
