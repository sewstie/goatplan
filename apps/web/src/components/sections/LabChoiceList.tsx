import type { Section } from "@/lib/data/types";
import { LabChoiceRow } from "./LabChoiceRow";

export function LabChoiceList({ id, courseCode, kind, choices, onChoose }: { id: string; courseCode: string; kind: string; choices: Section[]; onChoose: (section: Section) => void }) {
  return (
    <ul id={id} aria-label={`Other ${kind} choices`} className="flex flex-col gap-4">
      {choices.map((section) => <LabChoiceRow key={section.id} courseCode={courseCode} section={section} onChoose={() => onChoose(section)} />)}
    </ul>
  );
}
