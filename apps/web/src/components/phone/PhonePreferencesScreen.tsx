"use client";

import { useMemo } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { BlockTimeButton } from "@/components/preferences/BlockTimeButton";
import { groupBlocked, groupDays, groupTimes, removeGroup } from "@/components/preferences/blockedTimes";
import { startsAfterOptions } from "@/components/preferences/timeOptions";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { usePlanner } from "@/lib/store";
import { BackLink } from "./BackLink";

/** Start time, Only open sections and the blocked times, as one screen (div-app-phone-32, -42). */
export function PhonePreferencesScreen() {
  const preferences = usePlanner((state) => state.preferences);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const options = useMemo(() => startsAfterOptions(preferences.startsAfter), [preferences.startsAfter]);
  const groups = useMemo(() => groupBlocked(preferences.blocked), [preferences.blocked]);

  return (
    <div className="flex flex-col">
      <BackLink />
      <h1 data-screen-heading tabIndex={-1} className="pt-6 text-25 leading-30 font-700 tracking-title outline-none">
        Preferences
      </h1>
      <p className="pt-6 pb-16 text-9 text-ink-muted">These choices apply to every course.</p>

      <div id="tutorial-preferences" role="group" aria-label="Preferences" className="flex flex-col rounded-panel border border-line bg-surface px-16 py-16">
        <Select
          id="tutorial-start-time"
          label="Classes start"
          hideLabel={false}
          options={options}
          value={String(preferences.startsAfter)}
          onChange={(event) => setPreferences({ startsAfter: Number(event.target.value) })}
        />
        <div className="mt-14 flex items-center justify-between gap-12 border-t border-line pt-14">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-10 font-650">Only open sections</p>
            <p className="text-8 text-ink-muted">Include full sections by turning this off.</p>
          </div>
          <Toggle
            id="tutorial-only-open"
            checked={preferences.onlyOpen}
            onCheckedChange={(checked) => setPreferences({ onlyOpen: checked })}
            aria-label="Only open sections"
            label={null}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-8 pt-24 pb-10">
        <h2 className="text-10 font-650">Blocked time</h2>
        <BlockTimeButton variant="add" />
      </div>
      {groups.length === 0 ? (
        <div className="rounded-panel border border-dashed border-line-strong px-16 py-16">
          <p className="text-10">No blocked times.</p>
          <p className="pt-2 text-8 text-ink-muted">Your calendar stays open until you add one.</p>
        </div>
      ) : (
        <ul aria-label="Blocked times" className="flex flex-col gap-8">
          {groups.map((group) => {
            const days = groupDays(group);
            const times = groupTimes(group);
            return (
              <li key={`${group.label}-${group.start}-${group.end}`} className="flex items-center gap-12 rounded-panel border border-line bg-surface py-8 pr-8 pl-16">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="truncate text-10 font-700">{group.label ?? "Blocked"}</p>
                  <p className="text-9 text-ink-muted">{days} · {times}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove blocked time ${group.label ? `${group.label}, ` : ""}${days} ${times}`}
                  onClick={() => setPreferences({ blocked: removeGroup(preferences.blocked, group) })}
                  className="flex size-44 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink hover:bg-surface-selected"
                >
                  <X aria-hidden className="size-14" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div data-guide-slot="availability" className="pt-16 empty:hidden" />
    </div>
  );
}
