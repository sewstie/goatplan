import { Chip } from "@/components/ui/Chip";
import { Toggle } from "@/components/ui/Toggle";
import { formatTime } from "@/lib/data";
import type { SavedPlan } from "@/lib/plans";
import { SORT_PRESETS } from "@/lib/store";
import { groupBlocked, groupDays, groupTimes } from "./blockedTimes";

export function ReadOnlyPreferences({ plan }: { plan: SavedPlan }) {
  const { startsAfter, blocked, onlyOpen } = plan.preferences;
  return (
    <div
      role="group"
      aria-label="Preferences"
      className="flex min-h-35.5 shrink-0 flex-wrap items-center gap-7 px-2 py-1.5"
    >
      <span className="text-9 leading-13 font-600 text-ink-muted">Preferences</span>
      <Chip label="Starts after" value={startsAfter === 0 ? "Any time" : formatTime(startsAfter)} />
      {groupBlocked(blocked).map((group) => (
        <Chip
          key={`${group.label}-${group.start}-${group.end}`}
          label="Blocked"
          value={group.label ?? groupDays(group)}
          detail={group.label ? `· ${groupDays(group)} ${groupTimes(group)}` : groupTimes(group)}
        />
      ))}
      <Toggle checked={onlyOpen} disabled onCheckedChange={() => {}} label="Only open sections" className="ml-3" />
      <Chip label="Sort" value={SORT_PRESETS[plan.sortPreset].label} className="ml-auto" />
    </div>
  );
}
