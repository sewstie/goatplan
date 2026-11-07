"use client";

import type { TermName } from "@/lib/degree";
import { TermStatusFields, type TermAndState } from "./TermStatusFields";

type AddTargetCardProps = {
  target: TermAndState;
  onChange(next: TermAndState): void;
  startYear: number;
  current: TermName;
};

export function AddTargetCard({ target, onChange, startYear, current }: AddTargetCardProps) {
  return (
    <div className="rounded-card bg-canvas px-14 py-14">
      <TermStatusFields termLabel="Adding to" term={target.term} state={target.state} startYear={startYear} current={current} onChange={onChange} />
    </div>
  );
}
