"use client";

import { useMemo } from "react";
import { Listbox, type ListboxOption } from "@/components/ui/Listbox";
import { usePlanner } from "@/lib/store";
import { usePhoneScreen } from "./phoneScreen";

/**
 * "C Term 2027 ⌄" in the phone top bar, with the same list as the Sort and professor menus.
 * On a course's details screen the term can't change, so it's plain text there (phone-fix-1 to 4).
 */
export function PhoneTermSelect() {
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const setTerm = usePlanner((state) => state.setTerm);
  const courseScreen = usePhoneScreen((state) => state.screen === "course");

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

  const term = terms.find((item) => item.id === termId);
  if (courseScreen && term) {
    return (
      <p className="shrink-0 text-10 font-570 text-ink">
        <span className="sr-only">Term: </span>
        {term.name} {term.year}
      </p>
    );
  }

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
