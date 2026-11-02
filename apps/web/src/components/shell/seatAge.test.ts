import { describe, expect, it } from "vitest";
import { seatAge } from "./seatAge";

const now = Date.parse("2026-11-12T12:00:00Z");

describe("seatAge", () => {
  it.each([
    ["2026-11-12T12:00:00Z", "just now"],
    ["2026-11-12T11:58:00Z", "2 min ago"],
    ["2026-11-12T10:00:00Z", "2 h ago"],
    ["2026-11-11T12:00:00Z", "1 day ago"],
    ["2026-11-09T12:00:00Z", "3 days ago"],
  ])("says how old %s is", (timestamp, text) => {
    expect(seatAge(timestamp, now)).toBe(text);
  });
});
