"use client";

import { useMemo } from "react";
import { Listbox } from "@/components/ui/Listbox";
import { usePlanner } from "@/lib/store";
import { startsAfterOptions } from "./timeOptions";

/** "Starts after 9:00 AM ⌄", the same list as Sort: no class may start earlier. */
export function StartTimeSelect({ className }: { className?: string }) {
  const startsAfter = usePlanner((state) => state.preferences.startsAfter);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const options = useMemo(() => startsAfterOptions(startsAfter), [startsAfter]);

  return (
    <Listbox
      id="tutorial-start-time"
      variant="menu"
      label="Starts after"
      menuLabel="Starts after"
      className={className}
      options={options}
      value={String(startsAfter)}
      onChange={(value) => setPreferences({ startsAfter: Number(value) })}
    />
  );
}
