import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHeldHeight } from "./useHeldHeight";

let report: (height: number) => void = () => {};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) {
      report = (height) =>
        callback([{ borderBoxSize: [{ blockSize: height }], contentRect: { height } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.innerWidth = 1024;
});

function Box({ active }: { active: boolean }) {
  const [ref, style] = useHeldHeight<HTMLDivElement>(active);
  return <div data-testid="box" ref={ref} style={style} />;
}

const minHeight = () => screen.getByTestId("box").style.minHeight;

describe("useHeldHeight", () => {
  it("keeps the tallest height while active, so the box never shrinks", () => {
    render(<Box active />);
    act(() => report(40));
    act(() => report(90));
    act(() => report(50));
    expect(minHeight()).toBe("90px");
  });

  it("starts over when the window's width changes, like after a resize", () => {
    render(<Box active />);
    act(() => report(40));
    act(() => report(90));
    window.innerWidth = 700;
    act(() => report(120));
    expect(minHeight()).toBe("");
    act(() => report(60));
    expect(minHeight()).toBe("60px");
  });

  it("lets go once it isn't active", () => {
    const { rerender } = render(<Box active />);
    act(() => report(90));
    rerender(<Box active={false} />);
    expect(minHeight()).toBe("");
  });
});
