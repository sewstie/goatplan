import { describe, expect, it } from "vitest";
import {
  BLOCKED_TIERS,
  blockedLabel,
  blockedLine,
  blockHeight,
  blockLayout,
  CLASS_TIERS,
  clockRange,
  coveredTextMask,
  designPixels,
  NAMED_BLOCKED_TIERS,
} from "./blockLayout";

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

describe("blockLayout on tablet and up", () => {
  it("gives a class two lines from 38 px (16 + 16 of text, 4 of padding, 2 of border)", () => {
    expect(blockLayout(38, CLASS_TIERS)).toBe("full");
    expect(blockLayout(37.9, CLASS_TIERS)).toBe("line");
  });

  it("gives a class one line from 18 px (16 of text, 2 of border) and nothing below", () => {
    expect(blockLayout(18, CLASS_TIERS)).toBe("line");
    expect(blockLayout(17.9, CLASS_TIERS)).toBe("none");
  });

  it("gives a blocked time its name, time and 'blocked' from 62 px, and its short time and 'blocked' from 42 px", () => {
    expect(blockLayout(62, NAMED_BLOCKED_TIERS)).toBe("full");
    expect(blockLayout(61.9, NAMED_BLOCKED_TIERS)).toBe("line");
    expect(blockLayout(42, BLOCKED_TIERS)).toBe("full");
    expect(blockLayout(41.9, BLOCKED_TIERS)).toBe("line");
  });

  it("gives a blocked time one line from 18 px (16 of text, 2 of border), which a 30-minute block has at the 36 px minimum", () => {
    expect(blockLayout(blockHeight(30, 36), BLOCKED_TIERS)).toBe("line");
    expect(blockLayout(17.9, BLOCKED_TIERS)).toBe("none");
  });

  it("gives a 50-minute class two lines from 50 px an hour and one line at the 36 px minimum", () => {
    expect(blockLayout(blockHeight(50, 50, 3), CLASS_TIERS)).toBe("full");
    expect(blockLayout(blockHeight(50, 49, 3), CLASS_TIERS)).toBe("line");
    expect(blockLayout(blockHeight(50, 36, 3), CLASS_TIERS)).toBe("line");
  });
});

describe("designPixels", () => {
  it("is unchanged at the 16 px root", () => {
    expect(designPixels(48, 16)).toBe(48);
  });

  it("measures a grown layout in the sizes the tiers are written in", () => {
    expect(designPixels(60, 20)).toBe(48);
    expect(designPixels(100, 20)).toBe(80);
  });

  it("keeps a block in the same tier at the 20 px root as at 16 px", () => {
    expect(blockLayout(designPixels(38 * 1.25, 20), CLASS_TIERS)).toBe("full");
    expect(blockLayout(designPixels(37 * 1.25, 20), CLASS_TIERS)).toBe("line");
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
