/** Splits off a room's number, so a narrow block can cut the building's name and keep the number. */
export function roomParts(room: string): { building: string; number: string } {
  const match = /^(.*\S)\s+(\S*\d\S*)$/.exec(room);
  return match ? { building: match[1], number: match[2] } : { building: room, number: "" };
}
