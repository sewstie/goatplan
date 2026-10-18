import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { isSeriousChange, rowChangeLabel, type RegistrationRow } from "@/lib/plans";

const headerCell = "border-b border-line px-5 py-9.5 text-left align-bottom text-9 leading-13 font-600 text-ink-muted";
const bodyCell = "border-b border-line px-5 py-14.5 align-top";

/** The sections to register, one row each (div.app-22). */
export function RegistrationTable({ rows, className }: { rows: RegistrationRow[]; className?: string }) {
  return (
    <table className={cx("w-full table-fixed border-collapse", className)}>
      <colgroup>
        <col className="w-[28%]" />
        <col className="w-[16%]" />
        <col className="w-[28%]" />
        <col className="w-[28%]" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className={headerCell}>
            Course
          </th>
          <th scope="col" className={headerCell}>
            Section
          </th>
          <th scope="col" className={headerCell}>
            Meeting time
          </th>
          <th scope="col" className={headerCell}>
            Room / instructor
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="h-[67.4px] break-inside-avoid">
            <td className={bodyCell}>
              <div className="flex flex-col gap-3.5">
                <span className="text-11 leading-17-6 font-700 text-ink">{row.course}</span>
                <span className="text-9 leading-14-85 text-ink-muted">{row.courseTitle}</span>
              </div>
            </td>
            <td className={bodyCell}>
              <div className="flex flex-col items-start gap-3.5">
                <span className="text-11 leading-17-6 font-700 text-ink">{row.section}</span>
                <span className="text-9 leading-14-85 text-ink-muted">{row.seats}</span>
                {row.change && (
                  <Badge tone={isSeriousChange(row.change) ? "warning" : "neutral"} size="sm" className="mt-2">
                    {rowChangeLabel(row.change)}
                  </Badge>
                )}
              </div>
            </td>
            <td className={cx(bodyCell, "pt-15.5 text-10 leading-16 text-ink")}>
              {row.meetings.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </td>
            <td className={cx(bodyCell, "pt-15.5")}>
              <div className="flex flex-col gap-3">
                <span className="text-10 leading-16 text-ink">{row.room}</span>
                <span className="text-9 leading-13 text-ink-muted">{row.instructors}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
