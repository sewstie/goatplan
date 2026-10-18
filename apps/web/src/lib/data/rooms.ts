// A room number: digits with an optional letter on either side, like 230, 120D or B06.
const ROOM_NUMBER = /^[A-Z]?\d{2,}[A-Z]?$/;

/**
 * The building and room of a meeting place, without the room's own name:
 * "Higgins Labs 230 Geom Modeling Computer Lab" → "Higgins Labs 230". Places without a room number,
 * like "Unity Hall" or "Off Campus", stay as they are, and so do both parts of "Little Theatre / Riley Commons".
 */
export function roomName(location: string): string {
  return location
    .trim()
    .split(" / ")
    .map((place) => {
      const words = place.split(" ");
      const number = words.findIndex((word, index) => index > 0 && ROOM_NUMBER.test(word));
      return number < 0 ? place : words.slice(0, number + 1).join(" ");
    })
    .join(" / ");
}
