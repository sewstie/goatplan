import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DegreeOpenedEvent } from "./DegreeOpenedEvent";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/lib/analytics/track", () => ({ track }));

it("sends degree_opened once, with nothing about the student", () => {
  const { rerender } = render(<DegreeOpenedEvent />);
  rerender(<DegreeOpenedEvent />);
  expect(track.mock.calls).toEqual([["degree_opened"]]);
});
