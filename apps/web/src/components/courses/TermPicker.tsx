"use client";

import { Select } from "@/components/ui/Select";
import { usePlanner } from "@/lib/store";
import { termFieldLabel } from "./courseSummary";

/** The term field and the line under it (docs/design/screens/div.app.md). */
export function TermPicker() {
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const setTerm = usePlanner((state) => state.setTerm);
  const current = terms.find((term) => term.id === termId);

  const options =
    terms.length > 0
      ? terms.map((term) => ({ value: term.id, label: termFieldLabel(term) }))
      : [{ value: "", label: "Loading terms…" }];

  return (
    <div className="flex shrink-0 flex-col pb-15">
      <Select
        label="Term"
        options={options}
        value={current?.id ?? ""}
        disabled={terms.length === 0}
        onChange={(event) => void setTerm(event.target.value)}
      />
      <p className="min-h-18 px-2 pt-5 text-9 leading-13 text-ink-muted">
        {current && `All courses and sections in ${current.name}`}
      </p>
    </div>
  );
}
