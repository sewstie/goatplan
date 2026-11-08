import { Check, CircleDashed, Clock } from "@phosphor-icons/react/ssr";
import type { PlanState } from "@/lib/degree/planGrid";

export const PLAN_STATES: Record<PlanState, { label: string; Icon: typeof Check; tone: string }> = {
  taken: { label: "Taken", Icon: Check, tone: "border-success-soft bg-success-soft text-success-ink" },
  progress: { label: "In progress", Icon: Clock, tone: "border-accent-soft bg-accent-soft text-accent" },
  planned: { label: "Planned", Icon: CircleDashed, tone: "border-dashed border-tile-planned-line bg-accent-soft text-accent" },
};
