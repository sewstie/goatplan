import { tileMatchesFilter } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

export function useFilterCount(view: DegreeView): number {
  const filter = useDegreeUi((state) => state.filter);
  if (!filter) return 0;
  return view.sheet.sections.flatMap((section) => section.tiles).filter((tile) => tile.line !== 7 && tileMatchesFilter(tile, filter)).length;
}
