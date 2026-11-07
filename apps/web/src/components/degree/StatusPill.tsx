import { cx } from "@/components/ui/cx";
import type { PlanState } from "@/lib/degree/planGrid";
import { PLAN_STATES } from "./planStateLook";

export function StatusPill({ state }: { state: PlanState }) {
  const { label, Icon, tone } = PLAN_STATES[state];
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-4 rounded-badge border px-6 py-3 text-8 leading-11-2 font-570 whitespace-nowrap", tone)}>
      <Icon aria-hidden weight="bold" className="size-11" />
      {label}
    </span>
  );
}
