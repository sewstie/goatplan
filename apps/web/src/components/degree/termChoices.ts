import { termLong } from "@/lib/degree";

export function termChoices() {
  const terms = Array.from({ length: 5 }, (_, index) => 2026 + index).flatMap((year) =>
    (["A", "B", "C", "D"] as const).map((letter) => termLong({ letter, year })),
  );
  return [{ value: "", label: "No term" }, ...terms.map((term) => ({ value: term, label: term }))];
}
