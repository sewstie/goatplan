"use client";

import { groupBlocked, groupDays, groupTimes } from "@/components/preferences/blockedTimes";
import { formatTime } from "@/lib/data";
import { usePlanner } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { focusTutorialTarget } from "./focusTutorialTarget";

export function TutorialAvailability() {
  const preferences = usePlanner((state) => state.preferences);
  const groups = groupBlocked(preferences.blocked);

  return (
    <div role="group" aria-label="Current availability" className="pt-10">
      <p className="text-11 font-650">Current availability</p>
      <dl className="flex flex-wrap gap-x-20 gap-y-8 pt-5 text-11">
        <div><dt className="text-ink-muted">Starts after</dt><dd>{preferences.startsAfter === 0 ? "Any time" : formatTime(preferences.startsAfter)}</dd></div>
        <div>
          <dt className="text-ink-muted">Blocked time</dt>
          {groups.length === 0 ? <dd>None</dd> : groups.map((group) => (
            <dd key={`${group.label}-${group.start}-${group.end}`}>{group.label && `${group.label} · `}{groupDays(group)} {groupTimes(group)}</dd>
          ))}
        </div>
        <div><dt className="text-ink-muted">Sections</dt><dd>{preferences.onlyOpen ? "Only open sections" : "Open and full sections"}</dd></div>
      </dl>
      <p className="pt-8 text-12 text-ink-soft">To keep a break, use Block a time, choose your days, and set 12 PM–1 PM. Turn off Only open sections to include full sections.</p>
      <div className="flex flex-wrap gap-8 pt-10">
        <Button variant="soft" onClick={() => focusTutorialTarget("tutorial-block-time")}>Find Block a time</Button>
        <Button variant="soft" onClick={() => focusTutorialTarget("tutorial-only-open")}>Find Only open sections</Button>
      </div>
    </div>
  );
}
