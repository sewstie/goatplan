"use client";

import { useMemo } from "react";
import { Chip } from "@/components/ui/Chip";
import { usePlanner } from "@/lib/store";
import { groupBlocked, groupDays, groupTimes, removeGroup } from "./blockedTimes";

/** One pill per blocked range: "Blocked Tue, Fri 2 PM–4 PM ×". */
export function BlockedTimeChips() {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const groups = useMemo(() => groupBlocked(blocked), [blocked]);

  return groups.map((group) => {
    const days = groupDays(group);
    const times = groupTimes(group);
    return (
      <Chip
        key={`${group.start}-${group.end}`}
        label="Blocked"
        value={days}
        detail={times}
        onRemove={() => setPreferences({ blocked: removeGroup(blocked, group) })}
        removeLabel={`Remove blocked time ${days} ${times}`}
      />
    );
  });
}
