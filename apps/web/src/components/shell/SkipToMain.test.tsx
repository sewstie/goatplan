import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SkipToMain } from "./SkipToMain";

afterEach(() => window.history.replaceState(null, "", "/"));

it("keeps shared plan data when the keyboard skip link moves focus to the main content", async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, "", "/?share=reserved#p=plan-data");
  render(<><SkipToMain /><main id="main" tabIndex={-1}>Schedule</main></>);
  await user.tab();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("main")).toHaveFocus();
  expect(window.location.hash).toBe("#main&p=plan-data");
  expect(window.location.search).toBe("?share=reserved");
});
