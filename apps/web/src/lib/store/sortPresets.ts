import type { SortWeights } from "@/lib/engine/types";
import type { SortPresetId } from "./types";

/**
 * The Sort menu. Six presets in display order. Labels come from issues/product-brief.md.
 * Weights include the new late-minute pair (docs/engine-api.md explains the weights).
 */
export const SORT_PRESETS: Readonly<Record<SortPresetId, { label: string; weights: Required<SortWeights> }>> = {
  bestOverall: {
    label: "Best overall",
    weights: { earlyCutoff: 600, perEarlyMinute: 3, perGapMinute: 1, perDay: 60, lateCutoff: 1440, perLateMinute: 0 },
  },
  fewestEarly: {
    label: "Fewest early classes",
    weights: { earlyCutoff: 600, perEarlyMinute: 10, perGapMinute: 1, perDay: 20, lateCutoff: 1440, perLateMinute: 0 },
  },
  latestStart: {
    label: "Latest start",
    // 1:00 PM, not noon: on B-Term 2026 data a noon cutoff couldn't tell a 12 PM start from a 2 PM one.
    weights: { earlyCutoff: 780, perEarlyMinute: 10, perGapMinute: 1, perDay: 20, lateCutoff: 1440, perLateMinute: 0 },
  },
  earliestFinish: {
    label: "Earliest finish",
    weights: { earlyCutoff: 600, perEarlyMinute: 1, perGapMinute: 1, perDay: 20, lateCutoff: 900, perLateMinute: 10 },
  },
  fewestDays: {
    label: "Most days off",
    weights: { earlyCutoff: 600, perEarlyMinute: 1, perGapMinute: 1, perDay: 300, lateCutoff: 1440, perLateMinute: 0 },
  },
  fewestGaps: {
    label: "Most compact",
    weights: { earlyCutoff: 600, perEarlyMinute: 1, perGapMinute: 5, perDay: 20, lateCutoff: 1440, perLateMinute: 0 },
  },
};

export const SORT_PRESET_IDS = Object.keys(SORT_PRESETS) as SortPresetId[];

export function isSortPresetId(value: unknown): value is SortPresetId {
  return typeof value === "string" && value in SORT_PRESETS;
}
