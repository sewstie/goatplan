import type { Section } from "@/lib/data/types";
import { LectureChoiceRow } from "./LectureChoiceRow";
import type { LectureChoice } from "./sectionSteps";

export function LectureChoiceList({ id, choices, onChoose }: { id: string; choices: LectureChoice[]; onChoose: (section: Section) => void }) {
  return (
    <ul id={id} aria-label="Other lecture times" className="mt-5 mb-4 flex flex-col gap-4">
      {choices.map((choice) => <LectureChoiceRow key={choice.section.id} choice={choice} onChoose={() => onChoose(choice.section)} />)}
    </ul>
  );
}
