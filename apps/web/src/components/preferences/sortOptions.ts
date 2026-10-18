import type { SelectOption } from "@/components/ui/Select";
import { SORT_PRESETS, type SortPresetId } from "@/lib/store";

/** Only the sort orders a design shows. Today that's "Fewest early classes" (div.app-6.png). */
export const DESIGNED_SORT_PRESETS: readonly SortPresetId[] = ["fewestEarly"];

/** The designed orders, plus the current one if an older draft picked another. */
export function sortOptions(current: SortPresetId): SelectOption[] {
  const ids = DESIGNED_SORT_PRESETS.includes(current) ? DESIGNED_SORT_PRESETS : [...DESIGNED_SORT_PRESETS, current];
  return ids.map((id) => ({ value: id, label: SORT_PRESETS[id].label }));
}
