import type { SortWeights } from "@/lib/engine/types";
import type { SortPresetId } from "./types";

/**
 * The Sort menu. Only "Fewest early classes" is in the designs; the other two labels and all the
 * weights are a starting point to tune (docs/engine-api.md explains the weights).
 */
export const SORT_PRESETS: Readonly<Record<SortPresetId, { label: string; weights: Required<SortWeights> }>> = {
  fewestEarly: {
    label: "Fewest early classes",
    weights: { earlyCutoff: 600, perEarlyMinute: 10, perGapMinute: 1, perDay: 20 },
  },
  fewestGaps: {
    label: "Fewest gaps",
    weights: { earlyCutoff: 600, perEarlyMinute: 1, perGapMinute: 5, perDay: 20 },
  },
  fewestDays: {
    label: "Fewest days on campus",
    weights: { earlyCutoff: 600, perEarlyMinute: 1, perGapMinute: 1, perDay: 300 },
  },
};

export const SORT_PRESET_IDS = Object.keys(SORT_PRESETS) as SortPresetId[];

export function isSortPresetId(value: unknown): value is SortPresetId {
  return typeof value === "string" && value in SORT_PRESETS;
}
