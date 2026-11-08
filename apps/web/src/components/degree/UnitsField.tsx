"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/TextInput";
import { ChoiceChips } from "./ChoiceChips";

const COMMON = [
  { value: "1/3", label: "⅓" },
  { value: "1/6", label: "⅙" },
  { value: "2/3", label: "⅔" },
  { value: "1", label: "1" },
  { value: "other", label: "Other" },
] as const;

type UnitsFieldProps = {
  value: string;
  onChange(value: string): void;
  problem?: string | null;
};

export function UnitsField({ value, onChange, problem }: UnitsFieldProps) {
  const common = COMMON.some((option) => option.value === value && option.value !== "other");
  const [other, setOther] = useState(!common);
  const [picked, setPicked] = useState(false);
  return (
    <div className="flex flex-col gap-8">
      <ChoiceChips
        label="WPI units"
        options={COMMON}
        value={other ? "other" : value}
        onChange={(next) => {
          setOther(next === "other");
          setPicked(next === "other");
          onChange(next === "other" ? (common ? "" : value) : next);
        }}
      />
      {other && (
        <TextInput
          label="Units"
          autoFocus={picked}
          autoComplete="off"
          value={value}
          aria-invalid={problem ? true : undefined}
          hint={problem ? <span role="alert">{problem}</span> : "Enter WPI units, like 1/12. Not semester credits."}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
