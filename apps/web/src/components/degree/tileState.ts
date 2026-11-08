import { Check, CircleDashed, Clock, Info, Plus, Square } from "@phosphor-icons/react/ssr";
import { findHistoryCourse, type DegreeHistory, type SheetTile, type TermName } from "@/lib/degree";
import { coursePlanState } from "@/lib/degree/planGrid";

export type TileState = "done" | "progress" | "planned" | "check" | "empty" | "confirm";

export function tileState(tile: SheetTile, history: DegreeHistory, current: TermName | null): TileState {
  if (tile.kind === "tick") return tile.checked ? "done" : "confirm";
  if (tile.kind === "planned") {
    const course = tile.course ? findHistoryCourse(history, tile.course) : undefined;
    return course && coursePlanState(course, current) === "progress" ? "progress" : "planned";
  }
  return tile.kind;
}

export const TILE_LOOK: Record<TileState, { word: string; Icon: typeof Check; box: string; ink: string; pill: string }> = {
  done: { word: "Done", Icon: Check, box: "border-success-soft bg-success-soft", ink: "text-success-ink", pill: "border-success-soft bg-success-soft text-success-ink" },
  progress: { word: "In progress", Icon: Clock, box: "border-accent-line bg-accent-soft", ink: "text-accent", pill: "border-accent-soft bg-accent-soft text-accent" },
  planned: { word: "Planned", Icon: CircleDashed, box: "border-dashed border-tile-planned-line bg-accent-soft", ink: "text-accent", pill: "border-dashed border-tile-planned-line bg-accent-soft text-accent" },
  check: { word: "Check", Icon: Info, box: "border-tile-check-line bg-tile-check", ink: "text-notice-warning-ink", pill: "border-tile-check-line bg-tile-check text-notice-warning-ink" },
  empty: { word: "Needed", Icon: Plus, box: "border-dashed border-tile-empty-line bg-tile-empty", ink: "text-ink", pill: "border-line bg-surface text-ink-soft" },
  confirm: { word: "Confirm", Icon: Square, box: "border-tile-tick-line bg-surface", ink: "text-ink", pill: "border-line bg-surface text-ink-soft" },
};
