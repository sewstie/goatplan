"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { usePlanner } from "@/lib/store";
import { startsAfterOptions } from "./timeOptions";

/** "Starts after 9:00 AM": no class may start earlier. */
export function StartTimeSelect() {
  const startsAfter = usePlanner((state) => state.preferences.startsAfter);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const options = useMemo(() => startsAfterOptions(startsAfter), [startsAfter]);

  return (
    <Select
      id="tutorial-start-time"
      variant="pill"
      label="Starts after"
      options={options}
      value={String(startsAfter)}
      onChange={(event) => setPreferences({ startsAfter: Number(event.target.value) })}
    />
  );
}
