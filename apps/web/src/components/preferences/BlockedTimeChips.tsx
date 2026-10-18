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
  // The store ignores changes until the term is ready; then nothing is removed and focus shouldn't move later.
  const ready = usePlanner((state) => state.termStatus === "ready");
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
            key={`${group.label}-${group.start}-${group.end}`}
            label="Blocked"
            // With a name, as in the design: "Blocked Work · Tue, Fri 2 PM–4 PM".
            value={group.label ?? days}
            detail={group.label ? `· ${days} ${times}` : times}
            onRemove={() => {
              if (ready) removedIndex.current = index;
              setPreferences({ blocked: removeGroup(blocked, group) });
            }}
            removeLabel={`Remove blocked time ${group.label ? `${group.label}, ` : ""}${days} ${times}`}
          />
        );
      })}
    </span>
  );
}
