"use client";

import { useState } from "react";
import { Listbox, type ListboxOption } from "@/components/ui/Listbox";
import { selectSchedules, SORT_PRESET_IDS, SORT_PRESETS, usePlanner } from "@/lib/store";

// Every preset, in table order. The engine does the ranking; the menu only picks the preset.
const OPTIONS: readonly ListboxOption[] = SORT_PRESET_IDS.map((id) => ({ value: id, label: SORT_PRESETS[id].label }));

/** "Sort Best overall ⌄" at the end of the Preferences row. Shown only when there is more than one schedule to order. */
export function SortSelect() {
  const sortPreset = usePlanner((state) => state.sortPreset);
  const setSortPreset = usePlanner((state) => state.setSortPreset);
  // null while a new answer is on its way: Sort keeps its last state then, so picking an order
  // doesn't take the control (and keyboard focus) away while the engine re-ranks.
  const many = usePlanner((state) =>
    state.solveStatus === "waiting" || state.solveStatus === "solving" ? null : selectSchedules(state).length > 1,
  );
  const [shown, setShown] = useState(many === true);
  if (many !== null && many !== shown) setShown(many);

  if (!shown) return null;

  return (
    <Listbox
      variant="menu"
      label="Sort"
      menuLabel="Sort"
      options={OPTIONS}
      value={sortPreset}
      onChange={(value) => {
        const preset = SORT_PRESET_IDS.find((id) => id === value);
        if (preset) setSortPreset(preset);
      }}
      className="ml-auto shrink-0"
    />
  );
}
