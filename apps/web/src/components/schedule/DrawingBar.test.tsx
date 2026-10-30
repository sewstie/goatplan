import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { usePhoneScreen } from "@/components/phone/phoneScreen";
import { polyfillDialog, startTestPlanner } from "@/components/sections/testing/plannerStore";
import { DrawingBar } from "./DrawingBar";

vi.mock("@/lib/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store")>()),
  usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
}));

beforeAll(polyfillDialog);

afterEach(() => {
  usePhoneScreen.setState({ screen: "schedule" });
});

async function drawing() {
  const { store } = await startTestPlanner({ courses: ["AE 2320"] });
  const view = render(<DrawingBar />);
  act(() => store.getState().setDrawing(true));
  expect(screen.getByRole("group", { name: "Drawing mode" })).toBeInTheDocument();
  return { store, ...view };
}

describe("DrawingBar", () => {
  it("shows nothing while drawing mode is off", async () => {
    await startTestPlanner({ courses: ["AE 2320"] });
    render(<DrawingBar />);
    expect(screen.queryByRole("group", { name: "Drawing mode" })).not.toBeInTheDocument();
  });

  it("turns drawing mode off when any dialog opens", async () => {
    const { store } = await drawing();
    const other = document.createElement("dialog");
    document.body.append(other);
    other.showModal();
    await waitFor(() => expect(store.getState().drawing).toBe(false));
    other.remove();
  });

  it("turns drawing mode off when the phone shows another screen", async () => {
    const { store } = await drawing();
    act(() => usePhoneScreen.getState().show("course"));
    expect(store.getState().drawing).toBe(false);
  });

  it("turns drawing mode off when the page goes away", async () => {
    const { store, unmount } = await drawing();
    unmount();
    expect(store.getState().drawing).toBe(false);
  });

  it("keeps drawing mode when Escape was already used, like to cancel a drag", async () => {
    const { store } = await drawing();
    const event = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    event.preventDefault();
    act(() => {
      window.dispatchEvent(event);
    });
    expect(store.getState().drawing).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(store.getState().drawing).toBe(false);
  });
});
