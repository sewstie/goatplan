import { Badge } from "@/components/ui/Badge";
import { isSeriousChange, rowChangeLabel, type RegistrationRow } from "@/lib/plans";

const label = "text-9 leading-13 font-600 text-ink-muted";
const value = "text-10 leading-16 text-ink";

/** One card per section, with label/value rows, for phones (ticket 13). */
export function RegistrationCardList({ rows }: { rows: RegistrationRow[] }) {
  return (
    <div className="flex flex-col gap-10">
      {rows.map((row) => (
        <article
          key={row.id}
          className="flex flex-col gap-8 rounded-card border border-line bg-surface-subtle px-14 py-12"
        >
          <div className="flex flex-col gap-2">
            <span className={label}>Course</span>
            <span className="text-11 leading-17-6 font-700 text-ink">{row.course}</span>
            <span className="text-9 leading-14-85 text-ink-muted">{row.courseTitle}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Section</span>
            <span className="text-11 leading-17-6 font-700 text-ink">{row.section}</span>
            <span className="text-9 leading-14-85 text-ink-muted">{row.seats}</span>
            {row.change && (
              <Badge tone={isSeriousChange(row.change) ? "warning" : "neutral"} size="sm" className="mt-2 self-start">
                {rowChangeLabel(row.change)}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Days and time</span>
            {row.meetings.map((line) => (
              <span key={line} className={value}>
                {line}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Room</span>
            <span
              title={row.roomFull === row.room ? undefined : row.roomFull}
              className={value}
            >
              {row.room}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Instructor</span>
            <span className={value}>{row.instructors}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
