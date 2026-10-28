import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKeptScrollLeft } from "./useKeptScrollLeft";

let resized: () => void = () => {};

class FakeResizeObserver {
  constructor(callback: () => void) {
    resized = callback;
  }
  observe() {}
  disconnect() {
    resized = () => {};
  }
}

function setWidth(element: HTMLElement, width: number) {
  Object.defineProperty(element, "clientWidth", { value: width, configurable: true });
}

function scrollTo(element: HTMLElement, left: number) {
  element.scrollLeft = left;
  element.dispatchEvent(new Event("scroll"));
}

function scrolledScroller() {
  const element = document.createElement("div");
  setWidth(element, 300);
  const view = renderHook(() => useKeptScrollLeft({ current: element }));
  scrollTo(element, 157);
  return { element, ...view };
}

function hide(element: HTMLElement) {
  setWidth(element, 0);
  element.scrollLeft = 0;
  resized();
}

beforeEach(() => vi.stubGlobal("ResizeObserver", FakeResizeObserver));
afterEach(() => vi.unstubAllGlobals());

describe("useKeptScrollLeft", () => {
  it("scrolls back to where it was after being hidden and shown again", () => {
    const { element } = scrolledScroller();
    hide(element);
    setWidth(element, 300);
    resized();
    expect(element.scrollLeft).toBe(157);
  });

  it("ignores the scroll to the start that Safari reports as it shows again", () => {
    const { element } = scrolledScroller();
    hide(element);
    setWidth(element, 300);
    scrollTo(element, 0);
    resized();
    expect(element.scrollLeft).toBe(157);
  });

  it("leaves the scroll alone when it's only resized", () => {
    const { element } = scrolledScroller();
    scrollTo(element, 80);
    setWidth(element, 400);
    resized();
    expect(element.scrollLeft).toBe(80);
  });

  it("stops listening once unmounted", () => {
    const { element, unmount } = scrolledScroller();
    hide(element);
    unmount();
    setWidth(element, 300);
    resized();
    expect(element.scrollLeft).toBe(0);
  });
});
