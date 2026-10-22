import { cx } from "@/components/ui/cx";
import type { SaveState } from "@/lib/plans";

type PlanStatusProps = {
  status: SaveState["status"];
  error: string | null;
};

/** "Unsaved changes" or "Schedule saved" next to Saved plans. Always rendered, so changes are announced. */
export function PlanStatus({ status, error }: PlanStatusProps) {
  const text = error ?? (status === "saved" ? "Schedule saved" : status === "unsaved" ? "Unsaved changes" : "");
  return (
    <span
      role="status"
      aria-label="Save status"
      className={cx(
        "text-9 leading-13",
        error ? "text-warning" : status === "saved" ? "text-saved" : "text-ink-muted",
      )}
    >
      {text}
    </span>
  );
}
