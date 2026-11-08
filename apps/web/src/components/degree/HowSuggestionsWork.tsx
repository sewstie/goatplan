import { Disclosure } from "@/components/ui/Disclosure";

const POINTS = [
  "Picks courses that fill open lines on your CS sheet first, then courses that lead to them.",
  "Uses WPI’s recommended background. It’s guidance, not a prerequisite check.",
  "Courses planned for earlier terms count as done for later ones.",
  "Your current plans stay where they are. IQP and MQP blocks keep their term free.",
  "Seats and time conflicts aren’t checked. Look at sections in the planner before you register.",
];

export function HowSuggestionsWork() {
  return (
    <Disclosure summary="How this works">
      <ul className="flex list-disc flex-col gap-4 pl-16 text-8-5 leading-15 text-ink-muted">{POINTS.map((point) => <li key={point}>{point}</li>)}</ul>
    </Disclosure>
  );
}
