// Turns WPI's meeting text ("M-T-R-F | 9:00 AM - 9:50 AM") into days and minutes.

// R is Thursday because T is already Tuesday.
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

const NO_SET_TIME = /^(tba|tbd|arranged|n\/a)$/i;

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

export function parseTime(s) {
  const match = /^(\d{1,2}):(\d{2})\s*([AP])M$/i.exec((s ?? "").trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;

  // 12 AM is hour 0 and 12 PM is hour 12.
  const afternoon = match[3].toUpperCase() === "P";
  return ((hour % 12) + (afternoon ? 12 : 0)) * 60 + minute;
}

function parseDate(s) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!match) return null;
  return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

// "T-F | 2:00 PM - 3:20 PM", sometimes followed by " | 10/19/2026 - 12/11/2026".
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

// Section_Details says which room goes with which pattern. Locations alone
// can't when there are three patterns and two rooms.
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

// The same days and times in two rooms is one meeting.
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
    // No details: go by position if the counts match, otherwise list every room.
    const rooms = paired.get(piece) ?? (listed.length === pieces.length ? [listed[i]] : listed);
    meetings.push({ ...meeting, location: rooms.join(" / ") });
  });
  return mergeMeetings(meetings);
}
