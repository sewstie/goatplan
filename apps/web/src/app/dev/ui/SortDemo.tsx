"use client";

import { useState } from "react";
import { Listbox } from "@/components/ui/Listbox";
import { SORT_PRESET_IDS, SORT_PRESETS } from "@/lib/store";

const options = SORT_PRESET_IDS.map((id) => ({ value: id, label: SORT_PRESETS[id].label, description: SORT_PRESETS[id].description }));

export function SortDemo() {
  const [value, setValue] = useState<string>("fewestEarly");

  return <Listbox variant="menu" label="Sort" menuLabel="Sort" options={options} value={value} onChange={setValue} />;
}
