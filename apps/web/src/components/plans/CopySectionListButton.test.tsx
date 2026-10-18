import { useRef } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopySectionListButton } from "./CopySectionListButton";

const TEXT = "AE 2320 — CL01 (lecture), CX02 (lab)\nAE 2410 — C01 (lecture)";

function Example({ onFallback }: { onFallback: () => void }) {
  const ref = useRef<HTMLPreElement>(null);
  return (
    <>
      <CopySectionListButton text={TEXT} previewRef={ref} onCopied={() => {}} onFallback={onFallback} />
      <pre ref={ref}>{TEXT}</pre>
    </>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CopySectionListButton", () => {
  it("copies the section list and says Copied for a moment", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<Example onFallback={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Copy section list" }));
    expect(writeText).toHaveBeenCalledWith(TEXT);
    expect(await navigator.clipboard.readText()).toBe(TEXT);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Section list copied.");

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Copy section list" })).toBeInTheDocument();
  });

  it("selects the list for copying by hand when the clipboard is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Not allowed"));
    const onFallback = vi.fn();
    render(<Example onFallback={onFallback} />);
    await user.click(screen.getByRole("button", { name: "Copy section list" }));
    expect(onFallback).toHaveBeenCalled();
    expect(window.getSelection()?.toString()).toBe(TEXT);
  });
});
