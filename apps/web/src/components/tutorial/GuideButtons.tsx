import { Button } from "@/components/ui/Button";
import type { Ref } from "react";

type GuideButtonsProps = {
  first: boolean;
  last: boolean;
  waiting: boolean;
  onBack(): void;
  onSkip(): void;
  onNext(): void;
  finishRef: Ref<HTMLButtonElement>;
};

export function GuideButtons({ first, last, waiting, onBack, onSkip, onNext, finishRef }: GuideButtonsProps) {
  return <div className="mt-12 flex items-center gap-4">
    {!last && <button type="button" onClick={onSkip} className="-ml-6 cursor-pointer rounded-control px-6 py-7 text-10 text-ink-muted hover:text-ink">Skip</button>}
    {!first && <button type="button" onClick={onBack} className="ml-auto cursor-pointer rounded-control px-9 py-7 text-10 font-570 text-ink hover:bg-surface-selected">Back</button>}
    <Button ref={last ? finishRef : undefined} size="sm" aria-disabled={waiting} aria-describedby={waiting ? "guide-hint" : undefined} onClick={() => { if (!waiting) onNext(); }} className={`${first ? "ml-auto" : ""} px-14 aria-disabled:border-button-disabled aria-disabled:bg-button-disabled aria-disabled:text-button-disabled-ink`}>
      {last ? "Done" : "Next"}
    </Button>
  </div>;
}
