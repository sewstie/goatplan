import { Badge } from "@/components/ui/Badge";
import { isSeriousChange, rowChangeLabel, type RegistrationRow } from "@/lib/plans";

/** Group the per-section rows into one entry per course, keeping plan order. */
function byCourse(rows: RegistrationRow[]): { course: string; courseTitle: string; sections: RegistrationRow[] }[] {
  const groups: { course: string; courseTitle: string; sections: RegistrationRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.course === row.course) last.sections.push(row);
    else groups.push({ course: row.course, courseTitle: row.courseTitle, sections: [row] });
  }
  return groups;
}

/**
 * One compact card per course for phones, with a tight row per section inside it. A plan with eight
 * sections across four courses is four cards, not eight tall ones, so it scans with far less
 * scrolling. Each section still lists its code, type and seats, days and time, room and instructor.
 */
export function RegistrationCardList({ rows }: { rows: RegistrationRow[] }) {
  return (
    <div className="flex flex-col gap-10">
      {byCourse(rows).map((group) => (
        <article
          key={group.course}
          className="flex flex-col rounded-card border border-line bg-surface-subtle px-14 py-12"
        >
          <div className="flex flex-col gap-1 pb-8">
            <h3 className="text-11 leading-17-6 font-700 text-ink">{group.course}</h3>
            <p className="text-9 leading-14-85 text-ink-muted">{group.courseTitle}</p>
          </div>

          <ul className="flex flex-col divide-y divide-line">
            {group.sections.map((section) => (
              <li key={section.id} className="flex flex-col gap-3 py-8 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <span className="text-10 leading-16 font-650 text-ink">{section.section}</span>
                  <span className="text-9 leading-14-85 text-ink-muted">{section.seats}</span>
                  {section.change && (
                    <Badge
                      tone={isSeriousChange(section.change) ? "warning" : "neutral"}
                      size="sm"
                      className="self-center"
                    >
                      {rowChangeLabel(section.change)}
                    </Badge>
                  )}
                </div>
                {section.meetings.map((line) => (
                  <span key={line} className="text-9 leading-14-85 text-ink-muted">
                    {line}
                  </span>
                ))}
                <span
                  title={section.roomFull === section.room ? undefined : section.roomFull}
                  className="text-9 leading-14-85 text-ink-muted"
                >
                  {section.instructors ? `${section.room} · ${section.instructors}` : section.room}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
