"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { track } from "@/lib/analytics/track";
import { getDegreeSource } from "@/lib/degree";
import { SHEETS } from "@/lib/degree/sheets";
import { isSheetAvailable } from "@/lib/flags";
import { readPlanStart, savePlanStart } from "./usePlanStart";
import { useDegreeUi } from "./degreeUi";

const MAJORS = ["Computer Science", "Robotics Engineering", "Mechanical Engineering", "Electrical and Computer Engineering", "Data Science"];

export function MajorPickerFields({ selected, onDone }: { selected: string | null; onDone(): void }) {
  const [value, setValue] = useState(selected ?? "cs-2030");
  const [start, setStart] = useState(() => String(readPlanStart()));
  const [other, setOther] = useState("");
  const [requested, setRequested] = useState(false);
  const available = SHEETS.filter((sheet) => sheet.classYear === 2030 && isSheetAvailable(sheet.id));
  const sheet = available.find((item) => item.id === value);
  const unavailable = value !== "" && !sheet;
  const requestedMajor = value === "other" ? other.trim() : value;

  return (
    <div className="flex flex-col gap-14">
      <p className="text-9 leading-17 text-ink-muted">Choose the sheet that matches your major.</p>
      <fieldset className="degree-major-options"><legend className="sr-only">Major</legend>
        {MAJORS.map((major) => {
          const option = available.find((item) => item.major === major);
          const id = option?.id ?? major;
          return <label key={major} className={value === id ? "degree-major-option degree-major-option-selected" : "degree-major-option"}><input type="radio" name="degree-major" value={id} checked={value === id} onChange={() => { setValue(id); setRequested(false); }} /><span><strong>{major}</strong><small>{option ? `${option.abbreviation} · Class of 2030` : "Coming soon"}</small></span></label>;
        })}
      </fieldset>
      <Select label="When did you start?" hideLabel={false} value={start} options={[{ value: "2026", label: "A Term 2026" }, { value: "2027", label: "A Term 2027" }]} onChange={(event) => setStart(event.target.value)} />
      <p className="text-caption text-ink-muted">Your plan grid and term choices start here.</p>
      <div className="rounded-card border border-card-line bg-canvas px-14 py-12 text-caption text-ink-muted"><strong>Other class years: coming soon</strong><p className="pt-6">Minors and double majors aren’t supported yet.</p></div>
      <button type="button" className="cursor-pointer text-left text-caption font-650 text-accent" onClick={() => { setValue("other"); setRequested(false); }}>Another major · Request this major</button>
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
          savePlanStart(Number(start));
          getDegreeSource().selectSheet(sheet.id);
          useDegreeUi.getState().set({ panel: null, filter: null, keepPin: null, toast: null });
          onDone();
        }}>Open my sheet</Button>
      )}
    </div>
  );
}
