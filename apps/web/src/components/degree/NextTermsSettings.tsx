import type { ReactNode } from "react";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import type { TermName } from "@/lib/degree";
import { TermPicker } from "./TermPicker";

export const COURSE_CREDITS = 3;
const TERM_COUNTS = ["1", "2", "3", "4"] as const;
const LOADS = ["2", "3", "4"] as const;

type NextTermsSettingsProps = {
  start: string;
  onStart(value: string): void;
  count: string;
  onCount(value: string): void;
  load: string;
  onLoad(value: string): void;
  startYear: number;
  current: TermName;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex flex-col items-start"><span className="pb-5 text-10 leading-14-5 font-650 text-ink">{label}</span>{children}</div>;
}

export function NextTermsSettings({ start, onStart, count, onCount, load, onLoad, startYear, current }: NextTermsSettingsProps) {
  return (
    <div className="flex flex-col gap-14 rounded-card bg-canvas px-14 py-14">
      <TermPicker label="Starting term" value={start} onChange={onStart} startYear={startYear} current={current} />
      <div className="flex flex-wrap gap-x-20 gap-y-14">
        <Field label="Terms">
          <SegmentedSwitch label="Terms" value={count as (typeof TERM_COUNTS)[number]} options={TERM_COUNTS.map((value) => ({ value, label: value, icon: null }))} onChange={onCount} />
        </Field>
        <Field label="Courses per term">
          <SegmentedSwitch label="Courses per term" value={load as (typeof LOADS)[number]} options={LOADS.map((value) => ({ value, label: value, icon: null }))} onChange={onLoad} />
        </Field>
      </div>
    </div>
  );
}
