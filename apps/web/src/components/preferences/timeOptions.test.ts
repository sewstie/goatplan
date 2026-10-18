import { describe, expect, it } from "vitest";
import {
  ANY_TIME,
  BLOCK_TO,
  blockEndOptions,
  blockStartOptions,
  endAfter,
  startsAfterOptions,
  timesBetween,
} from "./timeOptions";

describe("timesBetween", () => {
  it("includes both ends", () => {
    expect(timesBetween(540, 600)).toEqual([540, 570, 600]);
  });
});

describe("startsAfterOptions", () => {
  it("starts with Any time, then 7:00 AM to 1:00 PM by half hours", () => {
    const options = startsAfterOptions(540);
    expect(options[0]).toEqual({ value: "0", label: "Any time" });
    expect(options[1]).toEqual({ value: "420", label: "7:00 AM" });
    expect(options.at(-1)).toEqual({ value: "780", label: "1:00 PM" });
    expect(options.find((option) => option.value === "540")?.label).toBe("9:00 AM");
    expect(options).toHaveLength(14);
  });

  it("adds a value that isn't on the list, in order", () => {
    const options = startsAfterOptions(535);
    const index = options.findIndex((option) => option.value === "535");
    expect(options[index].label).toBe("8:55 AM");
    expect(options[index - 1].value).toBe("510");
    expect(options[index + 1].value).toBe("540");
  });

  it("doesn't add Any time twice", () => {
    expect(startsAfterOptions(ANY_TIME).filter((option) => option.value === "0")).toHaveLength(1);
  });
});

describe("blocked time choices", () => {
  it("lets a block start from 7:00 AM and end by 10:00 PM", () => {
    expect(blockStartOptions()[0].label).toBe("7:00 AM");
    expect(blockStartOptions().at(-1)!.label).toBe("9:30 PM");
    expect(blockEndOptions(840)[0].label).toBe("2:30 PM");
    expect(blockEndOptions(840).at(-1)!.label).toBe("10:00 PM");
  });

  it("keeps the end after the start", () => {
    expect(endAfter(840, 960)).toBe(960);
    expect(endAfter(840, 840)).toBe(900);
    expect(endAfter(900, 720)).toBe(960);
    expect(endAfter(BLOCK_TO - 30, 600)).toBe(BLOCK_TO);
  });
});
