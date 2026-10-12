// Turns WPI's meeting text into numbers the engine and UI can use.
//
//   "M-T-R-F | 9:00 AM - 9:50 AM"  →  { days: ["Mon","Tue","Thu","Fri"], start: 540, end: 590 }
//
// Everything here is a pure function. Text that can't be read comes back as
// null (or is reported through `onUnparsed`) instead of throwing, so one odd
// row never stops the whole run.

// WPI's one-letter day codes in week order. R is Thursday, because T is Tuesday.
const DAY_CODES = new Map([
  ["M", "Mon"],
  ["T", "Tue"],
  ["W", "Wed"],
  ["R", "Thu"],
  ["F", "Fri"],
  ["S", "Sat"],
  ["U", "Sun"],
]);

export const DAYS = [...DAY_CODES.values()];

// Values WPI uses when a section has no fixed time.
const NO_SET_TIME = /^(tba|tbd|arranged|n\/a)$/i;

// "M-T-R-F" → ["Mon","Tue","Thu","Fri"]. Empty text → []. Unknown letter → null.
export function parseDays(s) {
  const text = (s ?? "").trim();
  if (text === "") return [];

  const found = new Set();
  for (const code of text.split("-")) {
    const day = DAY_CODES.get(code.trim().toUpperCase());
    if (!day) return null;
    found.add(day);
  }
  return DAYS.filter((day) => found.has(day));
}

// "9:00 AM" → 540 (minutes after midnight). Unreadable text → null.
export function parseTime(s) {
  const match = /^(\d{1,2}):(\d{2})\s*([AP])M$/i.exec((s ?? "").trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;

  // 12 AM is hour 0 and 12 PM is hour 12, so 12 counts as 0 before PM adds 12.
  const afternoon = match[3].toUpperCase() === "P";
  return ((hour % 12) + (afternoon ? 12 : 0)) * 60 + minute;
}

// "10/19/2026" → "2026-10-19"
function parseDate(s) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!match) return null;
  return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

// One pattern: "T-F | 2:00 PM - 3:20 PM", optionally followed by
// " | 10/19/2026 - 12/11/2026" when it only applies to part of a semester.
function parsePattern(piece) {
  const [dayText, timeText, dateText, ...extra] = piece.split("|").map((part) => part.trim());
  if (timeText === undefined || extra.length > 0) return null;

  const days = parseDays(dayText);
  const times = timeText.split(/\s+-\s+/);
  if (!days || days.length === 0 || times.length !== 2) return null;

  const start = parseTime(times[0]);
  const end = parseTime(times[1]);
  if (start === null || end === null || start >= end) return null;

  const meeting = { days, start, end };
  if (dateText !== undefined) {
    const dates = dateText.split(/\s+-\s+/).map(parseDate);
    if (dates.length !== 2 || dates.includes(null)) return null;
    meeting.dates = { start: dates[0], end: dates[1] };
  }
  return meeting;
}

const splitList = (s) =>
  (s ?? "")
    .split(";")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean);

// Section_Details pairs each pattern with its room ("Fuller Labs 320 | W | 1:00 PM - 2:50 PM"),
// which the separate Locations field can't do when the two lists differ in length.
function roomsFromDetails(details) {
  const rooms = new Map();
  for (const part of splitList(details)) {
    const bar = part.indexOf("|");
    if (bar < 0) continue;
    const room = part.slice(0, bar).trim();
    const pattern = part.slice(bar + 1).trim();
    if (!room || !pattern) continue;
    if (!rooms.has(pattern)) rooms.set(pattern, []);
    rooms.get(pattern).push(room);
  }
  return rooms;
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Joins meetings that share days and times (a class split across two rooms)
// into one meeting, then sorts them in week order.
export function mergeMeetings(meetings) {
  const merged = new Map();
  for (const meeting of meetings) {
    const { days, start, end, dates } = meeting;
    const key = [days.join("-"), start, end, dates?.start ?? "", dates?.end ?? ""].join("|");
    if (!merged.has(key)) merged.set(key, { meeting: { days, start, end }, dates, rooms: new Set() });
    for (const room of (meeting.location ?? "").split(" / ")) {
      if (room) merged.get(key).rooms.add(room);
    }
  }

  return [...merged.values()]
    .map(({ meeting, dates, rooms }) => ({
      ...meeting,
      location: [...rooms].sort(compare).join(" / "),
      ...(dates ? { dates } : {}),
    }))
    .sort(
      (a, b) =>
        DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]) ||
        a.start - b.start ||
        a.end - b.end ||
        compare(a.dates?.start ?? "", b.dates?.start ?? "") ||
        compare(a.location, b.location),
    );
}

// Meeting_Patterns plus Locations → a meetings array.
//
//   parseMeetings("M-T-R-F | 9:00 AM - 9:50 AM", "Fuller Labs 311")
//   → [{ days: ["Mon","Tue","Thu","Fri"], start: 540, end: 590, location: "Fuller Labs 311" }]
//
// Several patterns are separated by ";". Empty or "TBA" text gives [].
// Pass `details` (WPI's Section_Details) to match rooms to patterns exactly,
// and `onUnparsed` to hear about every pattern that couldn't be read.
export function parseMeetings(patterns, locations = "", { details = "", onUnparsed } = {}) {
  const pieces = splitList(patterns).filter((piece) => !NO_SET_TIME.test(piece));
  const listed = splitList(locations);
  const paired = roomsFromDetails(details);

  const meetings = [];
  pieces.forEach((piece, i) => {
    const meeting = parsePattern(piece);
    if (!meeting) {
      onUnparsed?.(piece);
      return;
    }
    // Without details: one room per pattern if the counts match, otherwise every room listed.
    const rooms = paired.get(piece) ?? (listed.length === pieces.length ? [listed[i]] : listed);
    meetings.push({ ...meeting, location: rooms.join(" / ") });
  });
  return mergeMeetings(meetings);
}
