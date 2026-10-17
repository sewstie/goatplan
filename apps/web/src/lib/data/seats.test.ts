import { describe, expect, it } from "vitest";
import { formatOpenSeats, formatWaitlist, isFull, openSeats, optionOpenSeats } from "./seats";

const lecture = { enrolled: 84, capacity: 120 };
const lab = { enrolled: 36, capacity: 40 };
const overEnrolled = { enrolled: 21, capacity: 20 };

describe("openSeats", () => {
  it("is capacity minus enrolled", () => {
    expect(openSeats(lecture)).toBe(36);
  });

  it("never goes below 0 for over-enrolled sections", () => {
    expect(openSeats(overEnrolled)).toBe(0);
    expect(isFull(overEnrolled)).toBe(true);
    expect(isFull(lecture)).toBe(false);
  });
});

describe("optionOpenSeats", () => {
  it("is the lowest among the option's sections", () => {
    expect(optionOpenSeats([lecture, lab])).toBe(4);
    expect(optionOpenSeats([lecture, overEnrolled])).toBe(0);
    expect(optionOpenSeats([])).toBe(0);
  });
});

describe("formatOpenSeats", () => {
  it("reads X of Y open", () => {
    expect(formatOpenSeats(lecture)).toBe("36 of 120 open");
    expect(formatOpenSeats(overEnrolled)).toBe("0 of 20 open");
  });

  it("can say seats, as in the details panel", () => {
    expect(formatOpenSeats(lab, { seats: true })).toBe("4 of 40 seats open");
  });
});

describe("formatWaitlist", () => {
  it("reads X of Y on waitlist", () => {
    expect(formatWaitlist({ waitlist: { taken: 7, capacity: 15 } })).toBe("7 of 15 on waitlist");
  });
});
