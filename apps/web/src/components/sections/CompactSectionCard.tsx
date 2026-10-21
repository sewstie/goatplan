import type { ReactNode } from "react";
import { Clock } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/Card";
import type { Section } from "@/lib/data/types";
import { MetaRow } from "./MetaRow";
import { instructorLine, meetingLines, placeLine, seatsLine, sectionHeading } from "./sectionDetails";

export function CompactSectionCard({ section, control, problem }: { section: Section; control: ReactNode; problem: boolean }) {
  const place = placeLine(section);

  return (
    <Card as="article" variant={problem ? "problem" : "outlined"} className="flex flex-col gap-2 px-10 pt-13 pb-8">
      <div className="mb-6 flex items-center justify-between gap-8">
        <h4 id={`tutorial-section-${encodeURIComponent(section.id)}`} tabIndex={-1} className="rounded-badge text-10 leading-14-5 font-700 text-ink">
          {sectionHeading(section)}
        </h4>
        <div className="-my-3 flex">{control}</div>
      </div>
      <ul className="flex flex-col gap-2">
        {meetingLines(section).map((line) => <MetaRow key={line} icon={<Clock />}>{line}</MetaRow>)}
      </ul>
      <div className="mt-1 flex items-start justify-between gap-5 text-8 leading-12-8 text-ink-muted">
        <p className="min-w-0">
          {place && <><span title={place.full === place.text ? undefined : place.full}>{place.text}</span> · </>}{instructorLine(section)}
        </p>
        <p className="shrink-0">{seatsLine(section)}</p>
      </div>
    </Card>
  );
}
