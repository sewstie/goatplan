"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { selectSchedules, SORT_PRESET_IDS, usePlanner } from "@/lib/store";
import { sortOptions } from "./sortOptions";

/** "Sort Fewest early classes". Shown only when there is more than one schedule to order. */
export function SortSelect() {
  const sortPreset = usePlanner((state) => state.sortPreset);
  const setSortPreset = usePlanner((state) => state.setSortPreset);
  const manySchedules = usePlanner((state) => selectSchedules(state).length > 1);
  const options = useMemo(() => sortOptions(sortPreset), [sortPreset]);

  if (!manySchedules) return null;

  return (
    <Select
      variant="menu"
      label="Sort"
      options={options}
      value={sortPreset}
      onChange={(event) => {
        const preset = SORT_PRESET_IDS.find((id) => id === event.target.value);
        if (preset) setSortPreset(preset);
      }}
      className="ml-auto"
    />
  );
}
