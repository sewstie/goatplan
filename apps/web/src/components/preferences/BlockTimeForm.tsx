"use client";

import { useState, type FormEvent, type Ref } from "react";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { WEEK } from "@/lib/data";
import type { Day } from "@/lib/data/types";
import { DayCheckbox } from "./DayCheckbox";
import { blockEndOptions, blockStartOptions, endAfter } from "./timeOptions";

type BlockTimeFormProps = {
  id: string;
  onSubmit: (days: Day[], start: number, end: number, label: string) => void;
  /** The dialog shows the message next to its buttons, so the dialog keeps its height. */
  onError: (message: string | null) => void;
  /** The id of that message while it is shown. */
  errorId?: string;
  /** The name field, which takes focus when the dialog opens. */
  nameRef?: Ref<HTMLInputElement>;
};

const START_OPTIONS = blockStartOptions();

/** A name, days and a time range to keep free. The dialog's footer holds its submit button. */
export function BlockTimeForm({ id, onSubmit, onError, errorId, nameRef }: BlockTimeFormProps) {
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [start, setStart] = useState(12 * 60);
  const [end, setEnd] = useState(13 * 60);

  function toggleDay(day: Day, checked: boolean) {
    setDays((current) => (checked ? [...current, day] : current.filter((item) => item !== day)));
    if (checked) onError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (days.length === 0) {
      onError("Pick at least one day.");
      return;
    }
    onSubmit(days, start, end, label);
  }

  return (
    <form id={id} noValidate onSubmit={handleSubmit} className="flex flex-col gap-14 pt-8">
      <TextInput
        ref={nameRef}
        label="Name (optional)"
        hideLabel={false}
        placeholder="Work"
        maxLength={30}
        value={label}
        onChange={(event) => setLabel(event.target.value)}
      />
      <fieldset aria-describedby={errorId} className="flex flex-col">
        <legend className="mb-6 text-10 leading-14-5 font-650 text-ink">Days</legend>
        <div className="flex flex-wrap gap-5">
          {WEEK.map((day) => (
            <DayCheckbox
              key={day}
              day={day}
              checked={days.includes(day)}
              onChange={(checked) => toggleDay(day, checked)}
            />
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-10">
        <Select
          variant="box"
          label="From"
          hideLabel={false}
          className="min-h-38"
          options={START_OPTIONS}
          value={String(start)}
          onChange={(event) => {
            const next = Number(event.target.value);
            setStart(next);
            setEnd((current) => endAfter(next, current));
          }}
        />
        <Select
          variant="box"
          label="To"
          hideLabel={false}
          className="min-h-38"
          options={blockEndOptions(start)}
          value={String(end)}
          onChange={(event) => setEnd(Number(event.target.value))}
        />
      </div>
    </form>
  );
}
