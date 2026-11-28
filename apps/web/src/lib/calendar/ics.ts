import {
  WEEK,
  roomName,
  sectionTypeName,
  showsInstructor,
  uniqueInstructors,
  type Day,
  type Meeting,
  type Section,
  type Term,
} from "@/lib/data";
import type { DateRange } from "@/lib/data/types";
import type { SavedCourse } from "@/lib/plans/types";
import type { TermCalendar } from "./term-calendar";

const CATEGORY_COLORS = [
  "Blue",
  "Green",
  "Purple",
  "Orange",
  "Red",
  "Yellow",
  "Teal",
  "Brown",
  "Olive",
  "Gray",
];
const BUILDING_CODES: Record<string, string> = {
  "Alden Hall": "AH",
  "Atwater Kent": "AK",
  "Daniels Hall": "DH",
  "Fuller Labs": "FL",
  "Gateway Park 1 Room": "GP1",
  "Gateway Park 2 Room": "GP2",
  "Goddard Hall": "GH",
  "Gordon Library": "GL",
  "Harrington Auditorium": "HA",
  "Higgins Labs": "HL",
  "Innovation Studio": "IS",
  "Kaven Hall": "KH",
  "Olin Hall": "OH",
  "Recreation Center": "RC",
  "Salisbury Labs": "SL",
  "Salisbury Laboratories": "SL",
  "Stratton Hall": "SH",
  "Unity Hall": "UH",
  Washburn: "WB",
  "Washburn Shops": "WB",
};

function calendarRoom(location: string): string {
  return roomName(location)
    .split(" / ")
    .map((place) => {
      if (place.startsWith("Fuller Labs PHL ")) return "FLPHLWR";
      if (place.startsWith("Fuller Labs PHU ")) return "FLPHUPR";
      const match = /^(.+) ([A-Z]?\d+[A-Z]?|GH)(?: .*)?$/.exec(place);
      if (!match || !Object.hasOwn(BUILDING_CODES, match[1])) return place;
      return BUILDING_CODES[match[1]] + match[2];
    })
    .join(" / ");
}

const TIME_ZONE = "America/New_York";
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MAX_LINE_BYTES = 75;

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TIME_ZONE}`,
  "BEGIN:DAYLIGHT",
  "DTSTART:20070311T020000",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "DTSTART:20071104T020000",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

const encoder = new TextEncoder();

function fold(line: string): string {
  const parts: string[] = [];
  let part = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > MAX_LINE_BYTES) {
      parts.push(part);
      part = " ";
      bytes = 1;
    }
    part += character;
    bytes += size;
  }
  parts.push(part);
  return parts.join("\r\n");
}

function escapeText(text: string): string {
  return text.replace(/[\\;,]/g, "\\$&").replace(/\r?\n/g, "\\n");
}

function utcDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function firstSunday(year: number, month: number): number {
  const first = Date.UTC(year, month, 1);
  return first + ((7 - new Date(first).getUTCDay()) % 7) * DAY_MS;
}

function newYorkOffsetHours(day: number): number {
  const year = new Date(day).getUTCFullYear();
  const daylightStarts = firstSunday(year, 2) + 7 * DAY_MS;
  const daylightEnds = firstSunday(year, 10);
  return day >= daylightStarts && day < daylightEnds ? 4 : 5;
}

function utcStamp(time: number): string {
  return new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function until(endDate: string): string {
  const day = utcDay(endDate);
  return utcStamp(day + DAY_MS - 1000 + newYorkOffsetHours(day) * HOUR_MS);
}

function classDays(dates: DateRange, days: readonly Day[]): number[] {
  const weekdays = days.map((day) => (WEEK.indexOf(day) + 1) % 7);
  const found: number[] = [];
  for (let day = utcDay(dates.start); day <= utcDay(dates.end); day += DAY_MS) {
    if (weekdays.includes(new Date(day).getUTCDay())) found.push(day);
  }
  return found;
}

function localTime(day: number, minutes: number): string {
  const date = new Date(day).toISOString().slice(0, 10).replaceAll("-", "");
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${date}T${hours}${String(minutes % 60).padStart(2, "0")}00`;
}

function eventTitle(
  courseCode: string,
  section: Pick<Section, "code" | "type">,
): string {
  return `${courseCode} ${sectionTypeName(section.type)} ${section.code}`;
}

function description(section: Section): string {
  const professors = showsInstructor(section)
    ? uniqueInstructors([section])
    : [];
  const lines = [`Section: ${sectionTypeName(section.type)} ${section.code}`];
  if (professors.length > 0)
    lines.unshift(
      `${professors.length === 1 ? "Professor" : "Professors"}: ${professors.join(", ")}`,
    );
  return lines.join("\n");
}

function eventLines(
  uid: string,
  courseFields: string[],
  section: Section,
  meeting: Meeting,
  day: number,
  stamp: string,
  repeats: string[],
): string[] {
  const location = calendarRoom(meeting.location);
  return [
    "BEGIN:VEVENT",
    `UID:${uid}@goatplan`,
    `DTSTAMP:${stamp}`,
    ...courseFields,
    `DTSTART;TZID=${TIME_ZONE}:${localTime(day, meeting.start)}`,
    `DTEND;TZID=${TIME_ZONE}:${localTime(day, meeting.end)}`,
    ...repeats,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    `DESCRIPTION:${escapeText(description(section))}`,
    "END:VEVENT",
  ];
}

function meetingEvents(
  courseFields: string[],
  section: Section,
  meeting: Meeting,
  index: number,
  term: Pick<Term, "id" | "start" | "end">,
  calendar: TermCalendar | null,
  stamp: string,
): string[] {
  const dates = section.dates ?? term;
  const uid = `${term.id}-${encodeURIComponent(section.id)}-${index}`;
  const days = classDays(dates, meeting.days);
  const changed = new Set(
    [...(calendar?.noClass ?? []), ...(calendar?.swaps ?? [])].map((entry) =>
      utcDay(entry.date),
    ),
  );
  const removed = days.filter((day) => changed.has(day));
  const weekly =
    days.length > removed.length
      ? eventLines(uid, courseFields, section, meeting, days[0], stamp, [
          `RRULE:FREQ=WEEKLY;BYDAY=${meeting.days.map((day) => day.slice(0, 2).toUpperCase()).join(",")};UNTIL=${until(dates.end)}`,
          ...removed.map(
            (day) =>
              `EXDATE;TZID=${TIME_ZONE}:${localTime(day, meeting.start)}`,
          ),
        ])
      : [];
  const swapped = (calendar?.swaps ?? [])
    .filter(
      (swap) =>
        meeting.days.includes(swap.runs) &&
        swap.date >= dates.start &&
        swap.date <= dates.end,
    )
    .flatMap((swap) =>
      eventLines(
        `${uid}-${swap.date.replaceAll("-", "")}`,
        courseFields,
        section,
        meeting,
        utcDay(swap.date),
        stamp,
        [],
      ),
    );
  return [...weekly, ...swapped];
}

export function buildIcs(
  schedule: readonly SavedCourse[],
  term: Pick<Term, "id" | "start" | "end">,
  now: Date,
  calendar: TermCalendar | null = null,
): string {
  const stamp = utcStamp(now.getTime());
  const events = schedule.flatMap((course, index) => {
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    const title =
      course.title && course.title !== course.code
        ? `${course.code} ${course.title}`
        : course.code;
    const fields = [
      `SUMMARY:${escapeText(title)}`,
      `CATEGORIES:${color} Category,${escapeText(course.code)}`,
      `COLOR:${color}`,
    ];
    return course.sections.flatMap((section) =>
      section.meetings.flatMap((meeting, index) =>
        meetingEvents(fields, section, meeting, index, term, calendar, stamp),
      ),
    );
  });
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GoatPlan//Calendar export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    ...events,
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function sectionsWithoutTime(
  schedule: readonly SavedCourse[],
): string[] {
  return schedule.flatMap((course) =>
    course.sections
      .filter((section) => section.meetings.length === 0)
      .map((section) => eventTitle(course.code, section)),
  );
}

export function icsFileName(termId: string): string {
  const [year, letter] = termId.split("-");
  return `GoatPlan-${letter}-Term-${year}.ics`;
}
