"use client";

import { CheckCircle, Circle, CircleDashed, Info } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { CheckPill } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";

const LOOK = {
  missing: { word: "Missing", Icon: Circle, box: "border-card-line bg-surface", word_: "text-ink-muted" },
  review: { word: "Review", Icon: Info, box: "border-tile-check-line bg-tile-check", word_: "text-notice-warning-ink" },
  met: { word: "Met", Icon: CheckCircle, box: "border-card-line bg-surface", word_: "text-success" },
  planned: { word: "Planned", Icon: CircleDashed, box: "border-tile-planned-line bg-surface", word_: "text-accent" },
};

export function CheckPills({ pills }: { pills: readonly CheckPill[] }) {
  const open = useDegreeUi((state) => state.open);
  return (
    <div className="flex flex-col gap-8 tablet:flex-row tablet:items-center tablet:gap-12">
      <p className="text-caption leading-14-4 text-ink-muted">Checks</p>
      <ul className="flex flex-wrap gap-6">
        {pills.map((pill) => {
          const { word, Icon, box, word_ } = LOOK[pill.state];
          return (
            <li key={pill.id}>
              <button type="button" aria-label={`${pill.name}: ${word}. See the courses behind it`} onClick={() => open({ kind: "checks" })} className={cx("flex min-h-30 cursor-pointer items-center gap-7 rounded-row border px-10 hover:brightness-98", box)}>
                <Icon aria-hidden className="size-13 shrink-0 text-ink" />
                <span className="text-micro leading-13 font-600 tablet:text-caption">{pill.name}</span>
                <span className={cx("text-micro leading-13", word_)}>{word}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
