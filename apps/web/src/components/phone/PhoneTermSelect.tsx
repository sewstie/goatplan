"use client";

import { useMemo } from "react";
import { Listbox, type ListboxOption } from "@/components/ui/Listbox";
import { usePlanner } from "@/lib/store";

/** "C Term 2027 ⌄" in the phone top bar, with the same list as the Sort and professor menus. */
export function PhoneTermSelect() {
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const setTerm = usePlanner((state) => state.setTerm);

  const options = useMemo<ListboxOption[]>(
    () =>
      terms.length > 0
        ? terms.map((term) => ({
            value: term.id,
            label: `${term.name} ${term.year}`,
            description: `${term.season} ${term.year} · ${term.courses.toLocaleString("en-US")} courses`,
          }))
        : [{ value: "", label: "Loading terms…" }],
    [terms],
  );

  // The wrapper is the guide's outline target for the term step.
  return (
    <div className="w-168 shrink-0">
      <Listbox
        id="tutorial-term"
        variant="pill"
        label="Term"
        options={options}
        value={termId ?? ""}
        disabled={terms.length === 0}
        onChange={(value) => void setTerm(value)}
      />
    </div>
  );
}
