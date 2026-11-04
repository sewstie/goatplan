"use client";

import { Badge } from "@/components/ui/Badge";
import { CheckField } from "@/components/ui/CheckField";
import { DrawerFrame } from "@/components/ui/Drawer";
import { canConfirmDepth, checkRows, DEPTH_CONFIRMATION, getDegreeSource, type DegreeHistory } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const BADGES = {
  met: { tone: "success", word: "Met" },
  planned: { tone: "accent", word: "Planned" },
  missing: { tone: "neutral", word: "Missing" },
  check: { tone: "warning", word: "Check this yourself" },
  later: { tone: "neutral", word: "Review when used" },
} as const;

export function ChecksPanel({ view, history }: { view: DegreeView; history: DegreeHistory }) {
  const close = useDegreeUi((state) => state.close);
  const depth = view.result.checks.find((check) => check.id === "hua-depth");
  return (
    <DrawerFrame title="Requirement checks" onClose={close}>
      <p className="-mt-6 pb-12 text-8-5 leading-17 text-ink-muted">Checks explain the courses behind a requirement. They don’t add new numbered lines.</p>
      <ul>
        {checkRows(view.result.checks, history).map((row) => {
          const { tone, word } = BADGES[row.status];
          return (
            <li key={row.id} className="flex items-start justify-between gap-14 border-b border-line py-14 last:border-b-0">
              <div className="min-w-0">
                <h3 className="text-8-5 leading-16 font-650">{row.name}</h3>
                <p className="pt-5 text-8 leading-17 text-ink-muted">{row.text}</p>
                {row.id === "hua-depth" && depth && canConfirmDepth(depth) && (
                  <CheckField
                    className="pt-10"
                    label="My humanities depth courses are thematically related"
                    labelClassName="text-8 leading-16 font-510"
                    checked={history.manual.includes(DEPTH_CONFIRMATION)}
                    onChange={(event) => getDegreeSource().setManualItem(DEPTH_CONFIRMATION, event.target.checked)}
                  />
                )}
              </div>
              <Badge tone={tone} className="max-w-84 whitespace-normal! px-8! py-5! text-caption! leading-14-4!">{word}</Badge>
            </li>
          );
        })}
      </ul>
    </DrawerFrame>
  );
}
