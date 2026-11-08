"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/track";
import { getDegreeSource } from "@/lib/degree";
import { SHEETS } from "@/lib/degree/sheets";
import { useDegreeUi } from "./degreeUi";

const MAJORS = ["Computer Science", "Robotics Engineering", "Mechanical Engineering", "Electrical and Computer Engineering", "Data Science"];

export function MajorPickerFields({ selected, onDone }: { selected: string | null; onDone(): void }) {
  const [value, setValue] = useState(selected ?? "cs-2030");
  const [other, setOther] = useState("");
  const [requested, setRequested] = useState(false);
  const available = SHEETS.filter((sheet) => sheet.classYear === 2030);
  const sheet = available.find((item) => item.id === value);
  const requestedMajor = value === "other" ? other.trim() : value;

  return (
    <div className="flex flex-col gap-16">
      <p className="text-9 leading-17 text-ink-muted">For the Class of 2030, starting A Term 2026.</p>
      <fieldset className="degree-major-options"><legend className="sr-only">Major</legend>
        {MAJORS.map((major) => {
          const option = available.find((item) => item.major === major);
          const id = option?.id ?? major;
          return <label key={major} className={value === id ? "degree-major-option degree-major-option-selected" : "degree-major-option"}><input type="radio" name="degree-major" value={id} checked={value === id} onChange={() => { setValue(id); setRequested(false); }} /><span><strong>{major}</strong>{!option && <small>Coming soon</small>}</span></label>;
        })}
      </fieldset>
      {value === "other" ? (
        <label className="flex flex-col gap-6 text-9 leading-16 font-600">
          Major name
          <input value={other} maxLength={100} onChange={(event) => { setOther(event.target.value); setRequested(false); }} className="min-h-44 rounded-row border border-line bg-surface px-12 text-ink" />
        </label>
      ) : (
        <button type="button" className="cursor-pointer self-start text-caption font-650 text-accent hover:underline" onClick={() => { setValue("other"); setRequested(false); }}>My major isn’t listed</button>
      )}
      {sheet ? (
        <Button className="min-h-44" onClick={() => {
          getDegreeSource().selectSheet(sheet.id);
          useDegreeUi.getState().set({ panel: null, filter: null, keepPin: null, toast: null });
          onDone();
        }}>Open my sheet</Button>
      ) : (
        <>
          <Button disabled={!requestedMajor || requested} className="min-h-44" onClick={() => {
            track("degree_major_requested", { major: requestedMajor });
            setRequested(true);
          }}>Request this major</Button>
          {requested && <p role="status" className="text-9 leading-17 text-ink-muted">Thanks for letting us know.</p>}
        </>
      )}
      <p className="text-caption text-ink-muted">Other class years, minors and double majors aren’t supported yet.</p>
    </div>
  );
}
