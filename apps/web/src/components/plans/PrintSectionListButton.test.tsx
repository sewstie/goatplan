import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { PrintSectionListButton } from "./PrintSectionListButton";

afterEach(() => vi.restoreAllMocks());

it("opens the browser print dialog when Print is pressed", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  render(<PrintSectionListButton />);

  const button = screen.getByRole("button", { name: "Print" });
  expect(button).toHaveTextContent("Print");
  await user.click(button);

  expect(print).toHaveBeenCalledOnce();
});
