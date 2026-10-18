import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

function renderTooltip() {
  render(
    <Tooltip content="Tue · 10:00–10:50 AM">
      <button type="button">AE 2410 C01</button>
    </Tooltip>,
  );
  return screen.getByRole("button", { name: "AE 2410 C01" });
}

describe("Tooltip", () => {
  it("describes the trigger even while hidden", () => {
    const trigger = renderTooltip();
    expect(trigger).toHaveAccessibleDescription("Tue · 10:00–10:50 AM");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on keyboard focus and closes with Escape", async () => {
    renderTooltip();
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tue · 10:00–10:50 AM");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on hover and closes when the pointer leaves", async () => {
    const trigger = renderTooltip();
    await userEvent.hover(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.unhover(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes with Escape while hovered, without focus", async () => {
    const trigger = renderTooltip();
    await userEvent.hover(trigger);
    expect(trigger).not.toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("keeps descriptions the trigger already has", () => {
    render(
      <>
        <p id="note">Locked section</p>
        <Tooltip content="Thu · 3:00–3:50 PM">
          <button type="button" aria-describedby="note">
            AE 2320 CX02
          </button>
        </Tooltip>
      </>,
    );
    expect(screen.getByRole("button", { name: "AE 2320 CX02" })).toHaveAccessibleDescription(
      "Locked section Thu · 3:00–3:50 PM",
    );
  });

  describe("in a portal", () => {
    function renderPortal(describes = true) {
      render(
        <div data-testid="clipping" className="overflow-hidden">
          <Tooltip portal describes={describes} content="Tue · 10:00–10:50 AM">
            <button type="button" aria-label="AE 2410 C01, Tuesday">
              AE 2410
            </button>
          </Tooltip>
        </div>,
      );
      return screen.getByRole("button", { name: "AE 2410 C01, Tuesday" });
    }

    it("renders outside the clipping container while hovered, without a wrapper around the trigger", async () => {
      const trigger = renderPortal();
      expect(trigger.parentElement).toBe(screen.getByTestId("clipping"));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      await userEvent.hover(trigger);
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.parentElement).toBe(document.body);
      expect(tooltip).toHaveClass("fixed");
      expect(trigger).toHaveAccessibleDescription("Tue · 10:00–10:50 AM");

      await userEvent.unhover(trigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("closes on scroll and with Escape", async () => {
      renderPortal();
      await userEvent.tab();
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      await userEvent.tab({ shift: true });
      await userEvent.tab();
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      window.dispatchEvent(new Event("scroll"));
      await screen.findByRole("button", { name: "AE 2410 C01, Tuesday" });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("stays out of the description when the label says it all", async () => {
      const trigger = renderPortal(false);
      await userEvent.hover(trigger);
      expect(trigger).not.toHaveAccessibleDescription();
      expect(document.querySelector("[role=tooltip]")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
