"use client";

import { useMemo } from "react";
import { CaretDown, Clock } from "@phosphor-icons/react/ssr";
import { BlockTimeButton } from "@/components/preferences/BlockTimeButton";
import { groupBlocked, groupDays, groupTimes } from "@/components/preferences/blockedTimes";
import { ReadOnlyPreferences } from "@/components/preferences/ReadOnlyPreferences";
import { startsAfterOptions } from "@/components/preferences/timeOptions";
import { Toggle } from "@/components/ui/Toggle";
import { formatTimeShort } from "@/lib/data/time";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { usePhoneScreen } from "./phoneScreen";

const PILL = "relative inline-flex min-h-36 shrink-0 items-center gap-6 rounded-pill border border-line bg-surface px-8 text-9 after:absolute after:inset-x-0 after:-inset-y-4";

/**
 * The phone preferences: "After 9 AM ⌄", Only open and "+ Block a time" share one row (two on the
 * narrowest phones); the blocked times follow as chips that open the Preferences screen.
 */
export function PhonePreferenceChips() {
  const saved = usePlanner(selectSavedPlan);
  const startsAfter = usePlanner((state) => state.preferences.startsAfter);
  const blocked = usePlanner((state) => state.preferences.blocked);
  const onlyOpen = usePlanner((state) => state.preferences.onlyOpen);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const show = usePhoneScreen((state) => state.show);
  const options = useMemo(() => startsAfterOptions(startsAfter), [startsAfter]);
  const groups = useMemo(() => groupBlocked(blocked), [blocked]);

  if (saved) return <ReadOnlyPreferences plan={saved} />;

  return (
    <div role="group" aria-label="Preferences" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-6">
        <div className={`${PILL} min-w-0 flex-auto justify-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}>
          <Clock aria-hidden className="size-12 shrink-0" />
          <span aria-hidden className="truncate font-570">{startsAfter === 0 ? "Any time" : `After ${formatTimeShort(startsAfter)}`}</span>
          <CaretDown aria-hidden className="size-10 shrink-0" />
          <select
            aria-label="Starts after"
            value={String(startsAfter)}
            onChange={(event) => setPreferences({ startsAfter: Number(event.target.value) })}
            className="absolute inset-x-0 -inset-y-4 z-1 cursor-pointer appearance-none opacity-0"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <span className={`${PILL} flex-auto justify-center`}>
          <Toggle
            checked={onlyOpen}
            onCheckedChange={(checked) => setPreferences({ onlyOpen: checked })}
            aria-label="Only open sections"
            label="Only open"
            className="relative z-1 -my-4"
          />
        </span>
        <BlockTimeButton label="Block time" className="min-w-0 flex-auto justify-center px-8" />
      </div>
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-8">
          {groups.map((group) => (
            <button
              key={`${group.label}-${group.start}-${group.end}`}
              type="button"
              aria-label={`Blocked ${group.label ? `${group.label}, ` : ""}${groupDays(group)} ${groupTimes(group)}. Edit in preferences`}
              onClick={() => show("preferences")}
              className={`${PILL} cursor-pointer hover:bg-surface-selected`}
            >
              {group.label && <b className="font-700">{group.label}</b>}
              <span>{groupDays(group)} {groupTimes(group)}</span>
              <CaretDown aria-hidden className="size-10" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
