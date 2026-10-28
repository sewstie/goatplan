import type { SortPrimary } from "@/lib/engine/types";
import type { SortPresetId } from "./types";

/**
 * The Sort menu: six presets in display order. Each preset names the score field the engine ranks by first; ties fall back to Best overall (no primary).
 */
export const SORT_PRESETS: Readonly<Record<SortPresetId, { label: string; description: string; primary: SortPrimary | null }>> = {
  bestOverall: { label: "Best overall", description: "A balance of start time, gaps and days", primary: null },
  fewestEarly: { label: "Fewest early classes", description: "Fewer classes before 10 AM", primary: "earlyMinutes" },
  latestStart: { label: "Latest start", description: "Classes start as late as possible each day", primary: "firstStart" },
  earliestFinish: { label: "Earliest finish", description: "Classes end as early as possible each day", primary: "lastEnd" },
  fewestDays: { label: "Most days off", description: "Fewer days on campus", primary: "days" },
  fewestGaps: { label: "Most compact", description: "Less free time between classes", primary: "freeMinutes" },
};

export const SORT_PRESET_IDS = Object.keys(SORT_PRESETS) as SortPresetId[];

export function isSortPresetId(value: unknown): value is SortPresetId {
  return typeof value === "string" && value in SORT_PRESETS;
}
