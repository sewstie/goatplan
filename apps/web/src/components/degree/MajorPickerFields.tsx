"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Listbox } from "@/components/ui/Listbox";
import { track } from "@/lib/analytics/track";
import { getDegreeSource } from "@/lib/degree";
import { SHEETS } from "@/lib/degree/sheets";
import { isDegreeEnabled } from "@/lib/flags";
import { useDegreeUi } from "./degreeUi";

const MAJORS = ["Computer Science", "Robotics Engineering", "Mechanical Engineering", "Electrical and Computer Engineering", "Data Science"];

export function MajorPickerFields({ selected, onDone }: { selected: string | null; onDone(): void }) {
  const [value, setValue] = useState(selected ?? "");
  const [other, setOther] = useState("");
  const [requested, setRequested] = useState(false);
  const available = SHEETS.filter((sheet) => sheet.classYear === 2030 && (sheet.status === "checked" || isDegreeEnabled()));
  const options = [
    { value: "", label: "Choose your major" },
    ...available.map((sheet) => ({ value: sheet.id, label: sheet.major })),
    ...MAJORS.filter((major) => !available.some((sheet) => sheet.major === major)).map((major) => ({ value: major, label: `${major} · Coming soon` })),
    { value: "other", label: "Another major · Coming soon" },
  ];
  const sheet = available.find((item) => item.id === value);
  const unavailable = value !== "" && !sheet;
  const requestedMajor = value === "other" ? other.trim() : value;

  return (
    <div className="flex flex-col gap-14">
      <p className="text-10 leading-17 font-600">Class of 2030</p>
      <p className="text-9 leading-17 text-ink-muted">Only Class of 2030 tracking sheets are supported.</p>
      <div className="flex flex-col gap-6">
        <span className="text-9 leading-16 font-600">Major</span>
        <Listbox label="Major" options={options} value={value} className="min-h-44" onChange={(next) => { setValue(next); setRequested(false); }} />
      </div>
      <p className="text-9 leading-17 text-ink-muted">Minors and double majors aren&apos;t supported yet</p>
      {value === "other" && (
        <label className="flex flex-col gap-6 text-9 leading-16 font-600">
          Major name
          <input value={other} maxLength={100} onChange={(event) => { setOther(event.target.value); setRequested(false); }} className="min-h-44 rounded-row border border-line bg-surface px-12 text-ink" />
        </label>
      )}
      {unavailable ? (
        <>
          <p className="text-9 leading-17 text-ink-muted">Coming soon</p>
          <Button disabled={!requestedMajor || requested} className="min-h-44" onClick={() => {
            track("degree_major_requested", { major: requestedMajor });
            setRequested(true);
          }}>Request this major</Button>
          {requested && <p role="status" className="text-9 leading-17 text-ink-muted">Thanks for letting us know.</p>}
        </>
      ) : (
        <Button disabled={!sheet} className="min-h-44" onClick={() => {
          if (!sheet) return;
          getDegreeSource().selectSheet(sheet.id);
          useDegreeUi.getState().set({ screen: "main", panel: null, filter: null, keepPin: null, restored: null, toast: null });
          onDone();
        }}>Continue</Button>
      )}
    </div>
  );
}
