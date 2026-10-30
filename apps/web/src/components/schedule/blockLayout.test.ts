import { describe, expect, it } from "vitest";
import { blockedLabel, blockedLine, blockHeight, blockLayout, clockRange, coveredTextMask } from "./blockLayout";

describe("blockLayout", () => {
  it("shows everything from 48 px, one line from 18 px and only the hatching below that", () => {
    expect(blockLayout(80)).toBe("full");
    expect(blockLayout(48)).toBe("full");
    expect(blockLayout(47.9)).toBe("line");
    expect(blockLayout(25.75)).toBe("line");
    expect(blockLayout(18)).toBe("line");
    expect(blockLayout(17.9)).toBe("none");
    expect(blockLayout(0)).toBe("none");
  });

  it("shows everything before the grid is measured", () => {
    expect(blockLayout(null)).toBe("full");
  });
});

describe("blockHeight", () => {
  it("turns minutes into px at the hour height, less the end gap", () => {
    expect(blockHeight(30, 67)).toBe(33.5);
    expect(blockHeight(60, 84, 3)).toBe(81);
    expect(blockHeight(30, null)).toBeNull();
  });

  it("gives a 30-minute block one line down to 36 px an hour, and none below that", () => {
    expect(blockLayout(blockHeight(30, 67))).toBe("line");
    expect(blockLayout(blockHeight(30, 51.5))).toBe("line");
    expect(blockLayout(blockHeight(30, 36))).toBe("line");
    expect(blockLayout(blockHeight(30, 35))).toBe("none");
    expect(blockLayout(blockHeight(60, 41))).toBe("line");
  });
});

describe("blocked block text", () => {
  it("writes one short line with the name, or the short time without one", () => {
    expect(clockRange(720, 750)).toBe("12–12:30");
    expect(clockRange(690, 780)).toBe("11:30–1");
    expect(blockedLine(720, 750, "Work")).toBe("Work · 12–12:30");
    expect(blockedLine(720, 750)).toBe("12–12:30 PM");
    expect(blockedLine(900, 930)).toBe("3–3:30 PM");
    expect(blockedLine(690, 750)).toBe("11:30 AM–12:30 PM");
  });

  it("says the whole thing in the label", () => {
    expect(blockedLabel("Mon", 720, 750, "Work")).toBe("Work, Monday 12:00 to 12:30 PM, blocked");
    expect(blockedLabel("Tue", 690, 780)).toBe("Tuesday 11:30 AM to 1:00 PM, blocked");
  });
});

describe("coveredTextMask", () => {
  it("is nothing when no class touches the block", () => {
    expect(coveredTextMask(600, 660, [])).toBeUndefined();
    expect(coveredTextMask(600, 660, [{ start: 540, end: 600 }, { start: 660, end: 720 }])).toBeUndefined();
  });

  it("hides the text in the part a class covers, clipped to the block", () => {
    expect(coveredTextMask(600, 660, [{ start: 600, end: 650 }])).toBe(
      "linear-gradient(to bottom, black 0%, transparent 0%, transparent 83.33%, black 83.33%)",
    );
    expect(coveredTextMask(600, 720, [{ start: 690, end: 800 }])).toBe(
      "linear-gradient(to bottom, black 75%, transparent 75%, transparent 100%, black 100%)",
    );
  });

  it("joins classes that overlap each other and keeps the gaps between others", () => {
    expect(coveredTextMask(600, 800, [{ start: 750, end: 800 }, { start: 600, end: 640 }, { start: 620, end: 650 }])).toBe(
      "linear-gradient(to bottom, black 0%, transparent 0%, transparent 25%, black 25%, black 75%, transparent 75%, transparent 100%, black 100%)",
    );
  });
});
