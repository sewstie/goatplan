"use client";

import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { compareTerms, nextTerm, parseTerm, termLong, type TermName } from "@/lib/degree";
import { stateForTerm, type PlanState } from "@/lib/degree/planGrid";
import { PLAN_STATES } from "./planStateLook";
import { TermPicker } from "./TermPicker";

export type TermAndState = { term: string; state: PlanState };

type TermStatusFieldsProps = TermAndState & {
  onChange(next: TermAndState): void;
  startYear: number;
  current: TermName;
  termLabel?: string;
  allowNone?: boolean;
};

const ORDER: PlanState[] = ["taken", "progress", "planned"];

export function termForState(state: PlanState, term: string, current: TermName): string {
  if (state === "progress") return termLong(current);
  const named = parseTerm(term);
  if (state === "planned" && named && compareTerms(named, current) <= 0) return termLong(nextTerm(current));
  return term;
}

export function TermStatusFields({ term, state, onChange, startYear, current, termLabel = "Term", allowNone = true }: TermStatusFieldsProps) {
  return (
    <div className="flex flex-col gap-14">
      <TermPicker
        label={termLabel}
        value={term}
        startYear={startYear}
        current={current}
        allowNone={allowNone}
        onChange={(next) => onChange({ term: next, state: stateForTerm(parseTerm(next), current) })}
      />
      <div className="flex flex-col items-start">
        <span className="pb-5 text-10 leading-14-5 font-650 text-ink">Status</span>
        <SegmentedSwitch
          label="Status"
          value={state}
          options={ORDER.map((value) => {
            const { label, Icon } = PLAN_STATES[value];
            return { value, label, icon: <Icon aria-hidden /> };
          })}
          onChange={(next) => onChange({ term: termForState(next, term, current), state: next })}
        />
      </div>
    </div>
  );
}
