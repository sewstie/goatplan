import { describe, expect, it } from "vitest";
import { wrappedHeight } from "./chipRows";

const chip = (width: number, height = 18) => ({ width, height });

describe("wrappedHeight", () => {
  it("is nothing with no chips", () => {
    expect(wrappedHeight([], 300, 4, 2)).toBe(0);
  });

  it("keeps chips that fit on one row", () => {
    expect(wrappedHeight([chip(100), chip(100), chip(92)], 300, 4, 2)).toBe(18);
  });

  it("counts the gaps between chips when deciding", () => {
    expect(wrappedHeight([chip(100), chip(100), chip(100)], 300, 4, 2)).toBe(38);
  });

  it("makes a row as tall as its tallest chip", () => {
    expect(wrappedHeight([chip(250), chip(80), chip(180, 24)], 270, 4, 2)).toBe(44);
  });

  it("lets a chip wider than the row have a row to itself", () => {
    expect(wrappedHeight([chip(400), chip(50)], 300, 4, 2)).toBe(38);
  });
});
