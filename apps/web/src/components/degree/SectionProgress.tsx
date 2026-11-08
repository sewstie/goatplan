import { CheckCircle } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { SheetSection } from "@/lib/degree";

const share = (count: number, total: number) => (total > 0 ? `${Math.min(100, (count / total) * 100)}%` : "0%");

export function SectionProgress({ section, className }: { section: Pick<SheetSection, "name" | "done" | "planned" | "total">; className?: string }) {
  const { name, done, planned, total } = section;
  const toGo = Math.max(0, total - done - planned);
  const complete = total > 0 && done >= total;
  return (
    <span className={cx("flex flex-col gap-5", className)}>
      <span
        role="progressbar"
        aria-label={`${name}: ${done} of ${total}`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} done, ${planned} planned, ${toGo} to go`}
        className="flex h-5 w-full overflow-hidden rounded-pill bg-track"
      >
        <span className={complete ? "bg-success" : "bg-chart-done"} style={{ width: share(done, total) }} />
        <span className="bg-chart-planned" style={{ width: share(planned, total) }} />
      </span>
      <span className={cx("flex items-center gap-4 text-8 leading-16", complete ? "font-570 text-success-ink" : "text-ink-muted")}>
        {complete ? <><CheckCircle aria-hidden weight="fill" className="size-12" />Complete</> : <>{done} of {total} done{planned > 0 && ` · ${planned} planned`}</>}
      </span>
    </span>
  );
}
