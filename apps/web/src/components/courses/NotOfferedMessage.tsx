import { ArrowClockwise } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import type { TermSummary } from "@/lib/data/types";
import { joinTermNames } from "./otherTerms";
import { SearchMessage } from "./SearchMessage";

type NotOfferedMessageProps = {
  code: string;
  termName: string;
  runsIn: TermSummary[];
  onSwitch(termId: string): void;
};

/** "AE 2320 isn’t offered in D Term." with a way back to a term that has it (div.app-5.md). */
export function NotOfferedMessage({ code, termName, runsIn, onSwitch }: NotOfferedMessageProps) {
  const target = runsIn[0];
  return (
    <SearchMessage title={`${code} isn’t offered in ${termName}.`} endsWithButton>
      <p className="text-10 leading-16-5 text-ink-muted">It runs in {joinTermNames(runsIn)}.</p>
      <Button
        size="sm"
        icon={<ArrowClockwise aria-hidden />}
        onClick={() => onSwitch(target.id)}
        className="mt-7 self-start"
      >
        Switch to {target.name}
      </Button>
    </SearchMessage>
  );
}
