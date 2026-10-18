import { describe, expect, it } from "vitest";
import { roomName } from "./rooms";

describe("roomName", () => {
  it("keeps the building and room number and drops the room's name", () => {
    expect(roomName("Higgins Labs 230 Geom Modeling Computer Lab")).toBe("Higgins Labs 230");
    expect(roomName("Atwater Kent 120D Robotics Lab")).toBe("Atwater Kent 120D");
    expect(roomName("Alden Hall B06 Janet Earle Room")).toBe("Alden Hall B06");
    expect(roomName("Washburn 107 Machine Shop")).toBe("Washburn 107");
  });

  it("leaves places that are already short, or have no room number, as they are", () => {
    for (const place of ["Unity Hall 400", "Salisbury Labs 223A", "Unity Hall", "Off Campus", "Online-synchronous"]) {
      expect(roomName(place)).toBe(place);
    }
  });

  it("doesn't mistake numbers in a building's name for a room", () => {
    expect(roomName("Gateway Park 1 Room 1002")).toBe("Gateway Park 1 Room 1002");
    expect(roomName("35/37 Institute")).toBe("35/37 Institute");
    expect(roomName("Recreation Center Courts 1-2")).toBe("Recreation Center Courts 1-2");
  });

  it("shortens each of two rooms used at once", () => {
    expect(
      roomName("Recreation Center 412 Class of 1961 Meeting Room 1 / Recreation Center 413 Class of 1961 Meeting Room 2"),
    ).toBe("Recreation Center 412 / Recreation Center 413");
    expect(roomName("Little Theatre / Riley Commons")).toBe("Little Theatre / Riley Commons");
  });
});
