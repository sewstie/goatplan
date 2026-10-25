import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";

afterEach(() => {
  vi.useRealTimers();
});

// The timer tests run on fake time and move the pointer and focus directly: user-event waits on
// real timers between steps. The keyboard and click tests use user-event on real time.
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const box = () => screen.getByRole("status").firstElementChild!;
const hover = () => fireEvent.pointerEnter(box());
const unhover = () => fireEvent.pointerLeave(box());
const focus = (name: string) => act(() => screen.getByRole("button", { name }).focus());

function setup(message: string | null = "Removed MA 1024") {
  const onAction = vi.fn();
  const onDismiss = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <>
      <button type="button">Remove CS 2022</button>
      <Toast message={message} action={{ label: "Undo", onAction }} onDismiss={onDismiss} />
      <button type="button">Page end</button>
    </>,
  );
  const rerender = (next: string | null) =>
    view.rerender(
      <>
        <button type="button">Remove CS 2022</button>
        <Toast message={next} action={{ label: "Undo", onAction }} onDismiss={onDismiss} />
        <button type="button">Page end</button>
      </>,
    );
  return { user, onAction, onDismiss, rerender };
}

describe("Toast", () => {
  it("is a polite status region whose text is the whole message", () => {
    setup();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Removed MA 1024 · Undo");
    expect(status).toContainElement(screen.getByRole("button", { name: "Undo" }));
  });

  it("keeps the live region on the page while there's nothing to show, so a new message is announced", () => {
    const { rerender } = setup(null);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    rerender("Removed MA 1024");
    expect(screen.getByRole("status")).toHaveTextContent("Removed MA 1024 · Undo");
  });

  it("never moves focus to itself", async () => {
    const { user, rerender } = setup(null);
    await user.click(screen.getByRole("button", { name: "Remove CS 2022" }));
    rerender("Removed CS 2022");
    expect(screen.getByRole("button", { name: "Remove CS 2022" })).toHaveFocus();
  });

  describe("timer", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("calls its dismiss handler after 6 seconds", () => {
      const { onDismiss } = setup();
      wait(5999);
      expect(onDismiss).not.toHaveBeenCalled();
      wait(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("pauses while the pointer is over it, then resumes with the time left", () => {
      const { onDismiss } = setup();
      wait(2000);
      hover();
      wait(20_000);
      expect(onDismiss).not.toHaveBeenCalled();
      unhover();
      wait(3999);
      expect(onDismiss).not.toHaveBeenCalled();
      wait(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("pauses while focus is inside it, then resumes with the time left", () => {
      const { onDismiss } = setup();
      wait(1000);
      focus("Undo");
      wait(20_000);
      expect(onDismiss).not.toHaveBeenCalled();
      focus("Page end");
      wait(4999);
      expect(onDismiss).not.toHaveBeenCalled();
      wait(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("stays paused while either the pointer or focus is still on it", () => {
      const { onDismiss } = setup();
      focus("Undo");
      hover();
      unhover();
      wait(20_000);
      expect(onDismiss).not.toHaveBeenCalled();
      hover();
      focus("Page end");
      wait(20_000);
      expect(onDismiss).not.toHaveBeenCalled();
      unhover();
      wait(6000);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("pauses again after resuming, counting only the time it ran", () => {
      const { onDismiss } = setup();
      wait(2000);
      hover();
      wait(1000);
      unhover();
      wait(2000);
      focus("Undo");
      wait(1000);
      focus("Page end");
      wait(1999);
      expect(onDismiss).not.toHaveBeenCalled();
      wait(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("restarts the timer for a new message", () => {
      const { onDismiss, rerender } = setup();
      wait(4000);
      rerender("Removed CS 2022");
      expect(screen.getByRole("status")).toHaveTextContent("Removed CS 2022 · Undo");
      wait(5999);
      expect(onDismiss).not.toHaveBeenCalled();
      wait(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("restarts the timer, unpaused, when the same message comes back after it was gone", () => {
      const { onDismiss, rerender } = setup();
      wait(3000);
      hover();
      rerender(null);
      rerender("Removed MA 1024");
      wait(5999);
      expect(onDismiss).not.toHaveBeenCalled();
      wait(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("keeps working with a handler that changes on every render", () => {
      function Shell() {
        const [dismissed, setDismissed] = useState(0);
        return (
          <>
            <p>Dismissed {dismissed}</p>
            <Toast message={dismissed ? null : "Removed MA 1024"} action={{ label: "Undo", onAction: () => {} }} onDismiss={() => setDismissed(dismissed + 1)} />
          </>
        );
      }
      render(<Shell />);
      wait(6000);
      expect(screen.getByText("Dismissed 1")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    });
  });

  it("runs its action from the keyboard with Enter or Space", async () => {
    const { user, onAction } = setup();
    await user.click(screen.getByRole("button", { name: "Remove CS 2022" }));
    await user.tab();
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it("runs its action on a click or tap", async () => {
    const { user, onAction } = setup();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("uses tokens only: surface, popover border and shadow, card radius, 11 px / 570 ink, accent action at 650", () => {
    setup();
    expect(box()).toHaveClass(
      "bg-surface", "border", "border-line-popover", "shadow-popover", "rounded-card",
      "text-11", "font-570", "text-ink", "px-14", "py-10", "gap-12",
    );
    expect(screen.getByRole("button", { name: "Undo" })).toHaveClass("text-accent", "font-650");
  });

  it("sits full width minus 16 px on phone and bottom centre from the tablet breakpoint", () => {
    setup();
    const region = screen.getByRole("status");
    expect(region).toHaveClass("fixed", "inset-x-16", "bottom-16", "justify-center");
    expect(box()).toHaveClass("w-full", "tablet:w-auto");
  });

  it("fades and slides in by 8 px, with no motion for reduced motion", () => {
    setup();
    expect(box()).toHaveClass(
      "starting:opacity-0", "starting:translate-y-8", "motion-reduce:transition-none",
    );
  });
});
