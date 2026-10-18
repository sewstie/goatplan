"use client";

import { useEffect, useMemo, useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import { usePlanner } from "@/lib/store";
import { groupBlocked, groupDays, groupTimes, removeGroup } from "./blockedTimes";

type BlockedTimeChipsProps = {
  /** Called after the last pill is removed, to move focus somewhere useful. */
  onAllRemoved: () => void;
};

/** One pill per blocked range: "Blocked Tue, Fri 2 PM–4 PM ×". */
export function BlockedTimeChips({ onAllRemoved }: BlockedTimeChipsProps) {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const groups = useMemo(() => groupBlocked(blocked), [blocked]);
  const listRef = useRef<HTMLSpanElement>(null);
  // The position of a pill just removed, so focus can move to its neighbour once it's gone.
  const removedIndex = useRef<number | null>(null);

  useEffect(() => {
    const index = removedIndex.current;
    if (index === null) return;
    removedIndex.current = null;
    const buttons = listRef.current?.querySelectorAll("button") ?? [];
    const next = buttons[Math.min(index, buttons.length - 1)];
    if (next) next.focus();
    else onAllRemoved();
  }, [groups, onAllRemoved]);

  return (
    <span ref={listRef} className="contents">
      {groups.map((group, index) => {
        const days = groupDays(group);
        const times = groupTimes(group);
        return (
          <Chip
            key={`${group.start}-${group.end}`}
            label="Blocked"
            value={days}
            detail={times}
            onRemove={() => {
              removedIndex.current = index;
              setPreferences({ blocked: removeGroup(blocked, group) });
            }}
            removeLabel={`Remove blocked time ${days} ${times}`}
          />
        );
      })}
    </span>
  );
}
