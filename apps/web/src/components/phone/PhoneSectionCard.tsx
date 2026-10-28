import { Clock, GraduationCap, MapPin, Users } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { InstructorRating } from "@/components/sections/InstructorRating";
import { SectionControl } from "@/components/sections/SectionControl";
import { instructorLine, meetingLines, placeLine, seatsLine, sectionHeading } from "@/components/sections/sectionDetails";
import { formatWaitlist, isFull, showsInstructor, uniqueInstructors } from "@/lib/data";
import type { Course, Section } from "@/lib/data/types";
import { PhoneFact } from "./PhoneFact";

type PhoneSectionCardProps = {
  course: Course;
  section: Section;
  locked: boolean;
  busy: boolean;
  onlyLecture: boolean;
  onLock?: () => void;
  onUnlocked?: () => void;
};

/** One chosen section on the phone course screen: a lecture with its professor's rating; labs and discussions without who teaches them. */
export function PhoneSectionCard({ course, section, locked, busy, onlyLecture, onLock, onUnlocked }: PhoneSectionCardProps) {
  const place = placeLine(section);
  const lecture = section.type === "lecture";
  const instructors = uniqueInstructors([section]);
  const seatsTone = isFull(section) ? "warning" : "success";

  return (
    <article className="flex flex-col rounded-message border border-line bg-surface px-16 pt-16 pb-16">
      <div className="flex min-h-32 items-center justify-between gap-8">
        <h3 className="text-11 font-700 text-ink">{sectionHeading(section)}</h3>
        <SectionControl course={course} section={section} locked={locked} readOnly={busy} onlyLecture={onlyLecture} onLock={onLock} onUnlocked={onUnlocked} phone />
      </div>
      <ul className="mt-10 flex flex-col gap-8">
        {meetingLines(section, "shared").map((line) => <PhoneFact key={line} icon={<Clock />}>{line}</PhoneFact>)}
        {place && (
          <PhoneFact icon={<MapPin />}>
            <span title={place.full === place.text ? undefined : place.full}>{place.text}</span>
          </PhoneFact>
        )}
        <PhoneFact icon={<Users />} tone={seatsTone}>{seatsLine(section)}</PhoneFact>
        {section.status === "waitlist" && <PhoneFact icon={<Users />}><Badge tone="warning">{formatWaitlist(section)}</Badge></PhoneFact>}
        {(lecture ? instructors.length === 0 : showsInstructor(section)) && <PhoneFact icon={<GraduationCap />}>{instructorLine(section)}</PhoneFact>}
      </ul>
      {lecture && instructors.length > 0 && (
        <div className="mt-14 flex flex-col gap-12">
          {instructors.map((name) => <InstructorRating key={name} name={name} phone />)}
        </div>
      )}
    </article>
  );
}
