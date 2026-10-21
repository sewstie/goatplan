import type { ReactNode } from "react";
import { Clock, GraduationCap, MapPin, Users } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Section } from "@/lib/data/types";
import { MetaRow } from "./MetaRow";
import { instructorLine, meetingLines, placeLine, seatsLine, sectionHeading } from "./sectionDetails";

export type RegularSectionCardProps = {
  section: Section;
  control: ReactNode;
  problem: boolean;
  showInstructor?: boolean;
  children?: ReactNode;
};

export function RegularSectionCard({ section, control, problem, showInstructor = true, children }: RegularSectionCardProps) {
  const place = placeLine(section);

  return (
    <Card as="article" variant={problem ? "problem" : "outlined"} className="flex flex-col gap-8 px-10 pt-15 pb-10">
      <div className="flex items-center justify-between gap-8">
        <h4 id={`tutorial-section-${encodeURIComponent(section.id)}`} tabIndex={-1} className="rounded-badge text-10 leading-14-5 font-700 text-ink">{sectionHeading(section)}</h4>
        <div className="-my-3 flex">{control}</div>
      </div>
      <ul className="flex flex-col gap-8">
        {meetingLines(section).map((line) => <MetaRow key={line} icon={<Clock />}>{line}</MetaRow>)}
        {place && (
          <MetaRow icon={<MapPin />}>
            <span title={place.full === place.text ? undefined : place.full}>{place.text}</span>
          </MetaRow>
        )}
        <MetaRow icon={<Users />}>{seatsLine(section)}</MetaRow>
        {section.status === "waitlist" && <MetaRow icon={<Users />}><Badge tone="warning">{section.waitlist.taken} of {section.waitlist.capacity} on waitlist</Badge></MetaRow>}
        {showInstructor && <MetaRow icon={<GraduationCap />}>{instructorLine(section)}</MetaRow>}
      </ul>
      {children}
    </Card>
  );
}
