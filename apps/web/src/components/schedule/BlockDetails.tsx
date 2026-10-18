import { formatTimeRange } from "@/lib/data/time";
import type { ClassItem } from "./scheduleItems";

/** What the block's tooltip says (div.app-19.md), with the room's full name. */
export function BlockDetails({ item }: { item: ClassItem }) {
  const place = [item.location, ...item.instructors].filter(Boolean).join(" · ");
  return (
    <>
      <p className="text-11 leading-15-95 font-700">
        {item.courseCode} · {item.sectionCode}
      </p>
      <p className="mt-3 mb-5 text-10 leading-15">{item.title}</p>
      <p className="text-9 leading-15-3 text-ink-muted">
        {item.day} · {formatTimeRange(item.start, item.end, "shared")}
      </p>
      {place && <p className="text-9 leading-15-3 text-ink-muted">{place}</p>}
    </>
  );
}
