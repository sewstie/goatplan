"use client";

import { CaretDown } from "@phosphor-icons/react/ssr";
import { useAlternativeSheet } from "./alternativeSheet";

type OtherChoicesButtonProps = {
  courseCode: string;
  /** "lab", as in "View other lab choices". */
  kind: string;
};

/** Opens ChooseAlternativeSheet, "Choose a lab", with the course's other options that fit. */
export function OtherChoicesButton({ courseCode, kind }: OtherChoicesButtonProps) {
  const open = useAlternativeSheet((state) => state.open);

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => open(courseCode)}
      className="mt-3.5 flex w-full cursor-pointer items-center justify-between rounded-badge px-3 py-2 text-9 leading-13-5 text-ink-muted transition-colors hover:text-ink"
    >
      View other {kind} choices
      <CaretDown aria-hidden className="size-11 text-ink" />
    </button>
  );
}
