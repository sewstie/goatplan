import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

function parts() {
  return {
    sidebar: <div data-testid="sidebar">sidebar</div>,
    header: <header>header</header>,
    toolbar: <div data-testid="toolbar">toolbar</div>,
    banner: <div data-testid="banner">banner</div>,
    schedule: <div data-testid="schedule">schedule</div>,
    phoneDisclosure: <div data-testid="disclosure">disclosure</div>,
    phoneSheet: <div data-testid="sheet">sheet</div>,
  };
}

describe("AppShell", () => {
  it("renders the sidebar, header, toolbar, banner and schedule", () => {
    render(<AppShell {...parts()} />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("Weekly schedule")).toBeInTheDocument();
  });

  it("places the phone disclosure between the header and the toolbar", () => {
    render(<AppShell {...parts()} />);
    const main = screen.getByRole("main");
    const nodes = [...main.children];
    const headerIndex = nodes.findIndex((node) => node.tagName === "HEADER");
    const disclosureIndex = nodes.findIndex((node) => node.getAttribute("data-testid") === "disclosure");
    const toolbarIndex = nodes.findIndex((node) => node.getAttribute("data-testid") === "toolbar");
    expect(headerIndex).toBeLessThan(disclosureIndex);
    expect(disclosureIndex).toBeLessThan(toolbarIndex);
  });

  it("renders the phone sheet outside the main layout", () => {
    render(<AppShell {...parts()} />);
    const sheet = screen.getByTestId("sheet");
    expect(sheet).toBeInTheDocument();
    expect(screen.getByRole("main")).not.toContainElement(sheet);
  });

  it("uses a phone side gutter that drops away at the tablet breakpoint", () => {
    const { container } = render(<AppShell {...parts()} />);
    const shell = container.querySelector("div.flex.min-h-dvh");
    expect(shell).toHaveClass("px-(--size-phone-gutter)", "tablet:p-(--size-app-padding)");
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
