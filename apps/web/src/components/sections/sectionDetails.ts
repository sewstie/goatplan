import { formatDays, formatOpenSeats, formatTimeRange, isFull, sectionTypeName } from "@/lib/data";
import type { Course, Delivery, Section, SectionType } from "@/lib/data/types";

/** "Lecture CL01". Sections of type "other" show only their code ("ON01"). */
export function sectionHeading(section: Pick<Section, "code" | "type">): string {
  return section.type === "other" ? section.code : `${sectionTypeName(section.type)} ${section.code}`;
}

/** "lab", as in "View other lab choices" and "Only lab". */
export function typeWord(type: SectionType): string {
  return type === "other" ? "section" : sectionTypeName(type).toLowerCase();
}

export function hasSetTime(section: Pick<Section, "meetings">): boolean {
  return section.meetings.some((meeting) => meeting.days.length > 0);
}

/** One line per meeting: "Mon–Fri · 9:00 AM–9:50 AM". */
export function meetingLines(section: Pick<Section, "meetings">): string[] {
  if (!hasSetTime(section)) return ["No scheduled meeting time"];
  return section.meetings
    .filter((meeting) => meeting.days.length > 0)
    .map((meeting) => `${formatDays(meeting.days)} · ${formatTimeRange(meeting.start, meeting.end)}`);
}

const ONLINE: Partial<Record<Delivery, string>> = {
  online: "Online",
  "online-sync": "Online · synchronous",
  "online-async": "Online · asynchronous",
};

/** The rooms, or how an online section is taught. null when the data has neither. */
export function placeLine(section: Pick<Section, "meetings" | "delivery">): string | null {
  const online = ONLINE[section.delivery];
  if (online) return online;
  const rooms = [...new Set(section.meetings.map((meeting) => meeting.location.trim()).filter(Boolean))];
  return rooms.length > 0 ? rooms.join(" · ") : null;
}

/** "36 of 120 seats open", with " · Full" when no seat is left. */
export function seatsLine(section: Pick<Section, "enrolled" | "capacity">): string {
  const seats = formatOpenSeats(section, { seats: true });
  return isFull(section) ? `${seats} · Full` : seats;
}

export function instructorLine(section: Pick<Section, "instructors">): string {
  const names = section.instructors.map((name) => name.trim()).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "Instructor not assigned yet";
}

/** A section every option of the course uses: there's nothing else to pick, so it can't be locked. */
export function isOnlyChoice(course: Pick<Course, "options">, sectionId: string): boolean {
  return course.options.length > 0 && course.options.every((option) => option.includes(sectionId));
}

/** The course's sections with these ids, in the given order. Unknown ids are skipped. */
export function sectionsById(course: Pick<Course, "sections">, ids: readonly string[]): Section[] {
  return ids.flatMap((id) => course.sections.find((section) => section.id === id) ?? []);
}
