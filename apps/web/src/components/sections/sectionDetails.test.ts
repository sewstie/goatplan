import { describe, expect, it } from "vitest";
import {
  hasSetTime,
  instructorLine,
  isOnlyChoice,
  meetingLines,
  placeLine,
  seatsLine,
  sectionHeading,
  sectionsById,
  typeWord,
} from "./sectionDetails";
import { makeSection, orbitalMechanics } from "./testing/sections";

describe("sectionHeading", () => {
  it("names the type before the code", () => {
    expect(sectionHeading({ code: "CL01", type: "lecture" })).toBe("Lecture CL01");
    expect(sectionHeading({ code: "CX02", type: "lab" })).toBe("Lab CX02");
  });

  it("shows only the code for other sections", () => {
    expect(sectionHeading({ code: "ON01", type: "other" })).toBe("ON01");
  });
});

describe("typeWord", () => {
  it("is lower case, and 'section' for other", () => {
    expect(typeWord("lab")).toBe("lab");
    expect(typeWord("discussion")).toBe("discussion");
    expect(typeWord("other")).toBe("section");
  });
});

describe("meetingLines", () => {
  it("joins days and time like the design", () => {
    expect(meetingLines(makeSection("AE 2320-CL01"))).toEqual(["Mon–Fri · 9:00 AM–9:50 AM"]);
  });

  it("lists non-consecutive days by name", () => {
    const section = makeSection("AB 1533-C01", {
      meetings: [{ days: ["Mon", "Tue", "Thu", "Fri"], start: 540, end: 590, location: "Olin Hall 126" }],
    });
    expect(meetingLines(section)).toEqual(["Mon, Tue, Thu, Fri · 9:00 AM–9:50 AM"]);
  });

  it("gives each meeting its own line", () => {
    const section = makeSection("X 1-C01", {
      meetings: [
        { days: ["Mon", "Wed"], start: 540, end: 590, location: "A" },
        { days: ["Fri"], start: 780, end: 890, location: "B" },
      ],
    });
    expect(meetingLines(section)).toEqual(["Mon, Wed · 9:00 AM–9:50 AM", "Fri · 1:00 PM–2:50 PM"]);
  });

  it("says when there is no set time", () => {
    const section = makeSection("X 1-ON01", { meetings: [] });
    expect(hasSetTime(section)).toBe(false);
    expect(meetingLines(section)).toEqual(["No scheduled meeting time"]);
  });
});

describe("placeLine", () => {
  it("shows the room", () => {
    expect(placeLine(makeSection("AE 2320-CL01"))?.text).toBe("Unity Hall 400");
  });

  it("shortens a room to its building and number, and keeps the full name", () => {
    const meetings = [{ days: ["Thu" as const], start: 900, end: 950, location: "Higgins Labs 230 Geom Modeling Computer Lab" }];
    expect(placeLine(makeSection("AE 2320-CX02", { meetings }))).toEqual({
      text: "Higgins Labs 230",
      full: "Higgins Labs 230 Geom Modeling Computer Lab",
    });
  });

  it("lists different rooms once each", () => {
    const section = makeSection("X 1-C01", {
      meetings: [
        { days: ["Mon"], start: 540, end: 590, location: "Olin Hall 126" },
        { days: ["Wed"], start: 540, end: 590, location: "Olin Hall 126" },
        { days: ["Fri"], start: 540, end: 590, location: "Goddard Hall 109" },
      ],
    });
    expect(placeLine(section)?.text).toBe("Olin Hall 126 · Goddard Hall 109");
  });

  it("describes online sections by how they are taught", () => {
    const meetings = [{ days: ["Tue" as const], start: 960, end: 1070, location: "Online-synchronous" }];
    expect(placeLine(makeSection("AE 5231-C02", { delivery: "online-sync", meetings }))?.text).toBe("Online · synchronous");
    expect(placeLine(makeSection("X 1-ON01", { delivery: "online-async", meetings: [] }))?.text).toBe("Online · asynchronous");
  });

  it("is null when there is nothing to show", () => {
    expect(placeLine(makeSection("BB 508-SX01", { meetings: [] }))).toBeNull();
  });
});

describe("seatsLine", () => {
  it("counts open seats", () => {
    expect(seatsLine({ enrolled: 84, capacity: 120 })).toBe("36 of 120 seats open");
  });

  it("adds Full when no seat is left", () => {
    expect(seatsLine({ enrolled: 40, capacity: 40 })).toBe("0 of 40 seats open · Full");
    expect(seatsLine({ enrolled: 45, capacity: 40 })).toBe("0 of 40 seats open · Full");
  });
});

describe("instructorLine", () => {
  it("joins instructors", () => {
    expect(instructorLine({ instructors: ["Ye Lu"] })).toBe("Ye Lu");
    expect(instructorLine({ instructors: ["Ye Lu", " Mark Richman "] })).toBe("Ye Lu, Mark Richman");
  });

  it("says when nobody is assigned", () => {
    expect(instructorLine({ instructors: [] })).toBe("Instructor not assigned yet");
    expect(instructorLine({ instructors: [" "] })).toBe("Instructor not assigned yet");
  });
});

describe("isOnlyChoice", () => {
  it("is true for a section in every option", () => {
    expect(isOnlyChoice(orbitalMechanics, "AE 2320-CL01")).toBe(true);
  });

  it("is false when other options leave it out", () => {
    expect(isOnlyChoice(orbitalMechanics, "AE 2320-CX02")).toBe(false);
  });

  it("is false for a course without options", () => {
    expect(isOnlyChoice({ options: [] }, "X")).toBe(false);
  });
});

describe("sectionsById", () => {
  it("keeps the order asked for and skips unknown ids", () => {
    const sections = sectionsById(orbitalMechanics, ["AE 2320-CX02", "nope", "AE 2320-CL01"]);
    expect(sections.map((section) => section.code)).toEqual(["CX02", "CL01"]);
  });
});
