import { Clock, GraduationCap, MapPin, Users } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Course, Section } from "@/lib/data/types";
import { LockButton } from "./LockButton";
import { MetaRow } from "./MetaRow";
import {
  hasSetTime,
  instructorLine,
  isOnlyChoice,
  meetingLines,
  placeLine,
  seatsLine,
  sectionHeading,
  typeWord,
} from "./sectionDetails";

type SectionChoiceCardProps = {
  course: Course;
  section: Section;
  locked: boolean;
  onUnlocked?: () => void;
  problem?: boolean;
  readOnly?: boolean;
};

/** One chosen section: its heading, Lock / Unlock (or why it can't be locked) and its facts. */
export function SectionChoiceCard({ course, section, locked, onUnlocked, problem = false, readOnly = false }: SectionChoiceCardProps) {
  const heading = sectionHeading(section);
  const place = placeLine(section);

  let control;
  if (readOnly && locked) {
    control = <Badge tone="accent">Locked</Badge>;
  } else if (readOnly) {
    control = isOnlyChoice(course, section.id) ? <Badge size="sm">Only {typeWord(section.type)}</Badge> : null;
  } else if (locked || (hasSetTime(section) && !isOnlyChoice(course, section.id))) {
    control = (
      <LockButton
        courseCode={course.code}
        sectionId={section.id}
        sectionName={heading}
        locked={locked}
        onUnlocked={onUnlocked}
      />
    );
  } else {
    control = <Badge size="sm">{hasSetTime(section) ? `Only ${typeWord(section.type)}` : "No set time"}</Badge>;
  }

  return (
    <Card as="article" variant={problem ? "problem" : "outlined"} className="flex flex-col gap-8 px-10 pt-15 pb-10">
      <div className="flex items-center justify-between gap-8">
        <h4 className="text-10 leading-14-5 font-700 text-ink">{heading}</h4>
        {/* As in the design, the control is taller than the heading and doesn't push the rows down. */}
        <div className="-my-3 flex">{control}</div>
      </div>
      <ul className="flex flex-col gap-8">
        {meetingLines(section).map((line) => (
          <MetaRow key={line} icon={<Clock />}>
            {line}
          </MetaRow>
        ))}
        {place && (
          <MetaRow icon={<MapPin />}>
            <span title={place.full === place.text ? undefined : place.full}>{place.text}</span>
          </MetaRow>
        )}
        <MetaRow icon={<Users />}>{seatsLine(section)}</MetaRow>
        <MetaRow icon={<GraduationCap />}>{instructorLine(section)}</MetaRow>
      </ul>
    </Card>
  );
}
