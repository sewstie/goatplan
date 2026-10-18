import { Clock, GraduationCap, MapPin, Users } from "@phosphor-icons/react/ssr";
import { formatDays, formatOpenSeats, formatTimeRange, formatWaitlist, sectionTypeName } from "@/lib/data";
import type { Section } from "@/lib/data/types";
import { MetaRow } from "./MetaRow";

/** One section of a course: times, room, seats and instructors. */
export function SectionItem({ section }: { section: Section }) {
  const rooms = [...new Set(section.meetings.map((meeting) => meeting.location).filter(Boolean))];

  return (
    <li className="flex flex-col gap-4">
      <h4 className="text-10 leading-14-5 font-700">
        {sectionTypeName(section.type)} {section.code}
      </h4>
      <ul className="flex flex-col gap-2">
        {section.meetings.length === 0 ? (
          <MetaRow icon={<Clock />}>No set time</MetaRow>
        ) : (
          section.meetings.map((meeting, index) => (
            <MetaRow key={index} icon={<Clock />}>
              {formatDays(meeting.days)} · {formatTimeRange(meeting.start, meeting.end)}
            </MetaRow>
          ))
        )}
        {rooms.map((room) => (
          <MetaRow key={room} icon={<MapPin />}>
            {room}
          </MetaRow>
        ))}
        <MetaRow icon={<Users />}>
          {formatOpenSeats(section, { seats: true })}
          {section.status === "waitlist" && ` · ${formatWaitlist(section)}`}
        </MetaRow>
        <MetaRow icon={<GraduationCap />}>
          {section.instructors.length > 0 ? section.instructors.join(", ") : "Instructor not assigned yet"}
        </MetaRow>
      </ul>
    </li>
  );
}
