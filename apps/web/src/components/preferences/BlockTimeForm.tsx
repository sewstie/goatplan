"use client";

import { useState, type FormEvent } from "react";
import { Select } from "@/components/ui/Select";
import { WEEK } from "@/lib/data";
import type { Day } from "@/lib/data/types";
import { DayCheckbox } from "./DayCheckbox";
import { blockEndOptions, blockStartOptions, endAfter } from "./timeOptions";

type BlockTimeFormProps = {
  id: string;
  onSubmit: (days: Day[], start: number, end: number) => void;
  /** The dialog shows the message next to its buttons, so the dialog keeps its height. */
  onError: (message: string | null) => void;
  /** The id of that message while it is shown. */
  errorId?: string;
};

const START_OPTIONS = blockStartOptions();

/** Days and a time range to keep free. The dialog's footer holds its submit button. */
export function BlockTimeForm({ id, onSubmit, onError, errorId }: BlockTimeFormProps) {
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
    onSubmit(days, start, end);
  }

  return (
    <form id={id} noValidate onSubmit={handleSubmit} className="flex flex-col gap-14 pt-8">
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
        <div className="flex flex-col">
          <span aria-hidden className="mb-5 text-10 leading-14-5 font-650 text-ink">
            From
          </span>
          <Select
            variant="box"
            label="From"
            options={START_OPTIONS}
            value={String(start)}
            onChange={(event) => {
              const next = Number(event.target.value);
              setStart(next);
              setEnd((current) => endAfter(next, current));
            }}
          />
        </div>
        <div className="flex flex-col">
          <span aria-hidden className="mb-5 text-10 leading-14-5 font-650 text-ink">
            To
          </span>
          <Select
            variant="box"
            label="To"
            options={blockEndOptions(start)}
            value={String(end)}
            onChange={(event) => setEnd(Number(event.target.value))}
          />
        </div>
      </div>
    </form>
  );
}
