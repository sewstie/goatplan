import { CheckCircle, Circle, CircleDashed, CircleHalf, Warning } from "@phosphor-icons/react/ssr";
import type { LineState } from "@/lib/degree";
import { cx } from "@/components/ui/cx";

const STATES = {
  done: { word: "Done", Icon: CheckCircle, weight: "fill", tone: "text-success" },
  planned: { word: "Planned", Icon: CircleDashed, weight: "bold", tone: "text-info-ink" },
  partial: { word: "Part done", Icon: CircleHalf, weight: "fill", tone: "text-ink-soft" },
  missing: { word: "Missing", Icon: Circle, weight: "regular", tone: "text-ink-muted" },
  check: { word: "Check this yourself", Icon: Warning, weight: "fill", tone: "text-warning" },
} as const;

export function StateLabel({ state }: { state: LineState }) {
  const { word, Icon, weight, tone } = STATES[state];
  return (
    <span className={cx("flex shrink-0 items-center gap-4 text-9 leading-14-4 font-570", tone)}>
      <Icon aria-hidden weight={weight} className="size-14 shrink-0" />
      {word}
    </span>
  );
}
