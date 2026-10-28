import { openSeats, uniqueInstructors } from "@/lib/data";
import type { Section } from "@/lib/data/types";

/** "12 seats open", "1 seat open" or "Full", for a row in the Change list. */
export function openSeatsShort(section: Pick<Section, "enrolled" | "capacity">): string {
  const open = openSeats(section);
  if (open === 0) return "Full";
  return `${open} ${open === 1 ? "seat" : "seats"} open`;
}

/**
 * "2 other professors" when each other lecture has its own single professor who doesn't teach this one,
 * otherwise "2 other times".
 */
export function otherChoicesLabel(current: Pick<Section, "type" | "instructors">, others: readonly Pick<Section, "instructors">[]): string {
  const teaching = new Set(uniqueInstructors([current]).map((name) => name.toLowerCase()));
  const names = uniqueInstructors(others);
  const professors = current.type === "lecture"
    && others.every((section) => uniqueInstructors([section]).length === 1)
    && names.length === others.length
    && names.every((name) => !teaching.has(name.toLowerCase()));
  const noun = professors ? "professor" : "time";
  return `${others.length} other ${noun}${others.length === 1 ? "" : "s"}`;
}
