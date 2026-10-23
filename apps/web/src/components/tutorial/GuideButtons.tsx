import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react/ssr";
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
  return <div className="mt-8 flex items-center gap-8">
    <Button variant="secondary" size="sm" disabled={first} onClick={onBack} icon={<CaretLeft aria-hidden />} className="min-h-34 disabled:border-button-disabled disabled:bg-button-disabled disabled:text-button-disabled-ink disabled:[&_svg]:opacity-40">Back</Button>
    <button type="button" onClick={onSkip} className="cursor-pointer whitespace-nowrap text-9 font-400 text-ink-muted">Skip guide</button>
    <Button ref={last ? finishRef : undefined} size="sm" aria-disabled={waiting} aria-describedby={waiting ? "guide-hint" : undefined} onClick={() => { if (!waiting) onNext(); }} className="ml-auto min-h-34 aria-disabled:border-button-disabled aria-disabled:bg-button-disabled aria-disabled:text-button-disabled-ink aria-disabled:[&_svg]:opacity-40">
      {last ? <Check aria-hidden /> : <CaretRight aria-hidden />}{last ? "Finish guide" : "Next"}
    </Button>
  </div>;
}
