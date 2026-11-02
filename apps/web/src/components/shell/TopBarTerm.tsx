"use client";

import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { usePlanner } from "@/lib/store";

/** The open term, on the right of the top bar. A shared plan can't change it, so the bar says Read-only instead. */
export function TopBarTerm() {
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const termStatus = usePlanner((state) => state.termStatus);
  const setTerm = usePlanner((state) => state.setTerm);
  const shared = usePlanner((state) => state.temporaryPlan !== null);
  const noTerms = terms.length === 0 && termStatus === "error";

  if (shared) return <Badge size="lg" className="px-8 py-5 text-9">Read-only</Badge>;

  const options =
    terms.length > 0
      ? terms.map((term) => ({ value: term.id, label: `${term.name} · ${term.year}` }))
      : [{ value: "", label: noTerms ? "No terms available" : "Loading terms…" }];

  return (
    <Select
      id="tutorial-term"
      variant="bar"
      label="Term"
      options={options}
      value={termId ?? ""}
      disabled={terms.length === 0}
      onChange={(event) => void setTerm(event.target.value)}
    />
  );
}
