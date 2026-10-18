"use client";

import { useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { Select } from "@/components/ui/Select";
import { rateMyProfessorsUrl } from "@/lib/data";

type ProfessorPickerProps = {
  instructors: string[];
  initial: string;
};

/** The course's instructors and a Rate My Professors search for the one picked. */
export function ProfessorPicker({ instructors, initial }: ProfessorPickerProps) {
  const [name, setName] = useState(initial);

  return (
    <div className="flex flex-col gap-4">
      <span aria-hidden className="mt-12 mb-5 text-10 leading-14-5 font-650 text-ink">
        Professor
      </span>
      <Select
        variant="box"
        label="Professor"
        options={instructors.map((instructor) => ({ value: instructor, label: instructor }))}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <a
        href={rateMyProfessorsUrl(name)}
        target="_blank"
        rel="noreferrer"
        className="mt-7.5 inline-flex items-center gap-5 self-start rounded-badge text-10 leading-14-5 text-accent hover:underline"
      >
        Rate My Professors
        <span className="sr-only">: {name} (opens in a new tab)</span>
        <ArrowSquareOut aria-hidden className="size-12" />
      </a>
    </div>
  );
}
