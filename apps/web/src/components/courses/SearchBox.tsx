"use client";

import type { KeyboardEvent, Ref } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { TextInput } from "@/components/ui/TextInput";

type SearchBoxProps = {
  value: string;
  onChange(value: string): void;
  onKeyDown(event: KeyboardEvent<HTMLInputElement>): void;
  disabled: boolean;
  resultsId: string;
  inputRef: Ref<HTMLInputElement>;
};

export function SearchBox({ value, onChange, onKeyDown, disabled, resultsId, inputRef }: SearchBoxProps) {
  return (
    <TextInput
      ref={inputRef}
      type="search"
      label="Search courses"
      placeholder="Course code or professor"
      icon={<MagnifyingGlass />}
      hint={disabled ? "Search works once sections load." : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      aria-controls={resultsId}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      className="shrink-0 pb-20"
    />
  );
}
