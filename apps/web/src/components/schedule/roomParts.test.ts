import { expect, it } from "vitest";
import { roomParts } from "./roomParts";

it.each([
  ["Gordon Library 208", "Gordon Library", "208"],
  ["Gateway Park 1 Room 1002", "Gateway Park 1 Room", "1002"],
  ["Fuller Labs PH-1", "Fuller Labs", "PH-1"],
])("keeps the number of %s apart", (room, building, number) => {
  expect(roomParts(room)).toEqual({ building, number });
});

it.each(["Online-synchronous", "Recreation Center Crew"])("leaves %s whole, since it has no number", (room) => {
  expect(roomParts(room)).toEqual({ building: room, number: "" });
});
