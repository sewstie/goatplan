import type { SeatSnapshot } from "./seatParser";
import type { Section, TermFile } from "./types";

export type SeatUpdate = Pick<Section, "enrolled" | "capacity" | "status" | "waitlist">;

/** Section id → seat update. Null means no fresher data is available. */
export type SeatData = Map<string, SeatUpdate> | null;

export function mergeSectionSeats(section: Section, update?: SeatUpdate): Section {
  if (!update || (
    section.enrolled === update.enrolled && section.capacity === update.capacity &&
    section.status === update.status && section.waitlist.taken === update.waitlist.taken &&
    section.waitlist.capacity === update.waitlist.capacity
  )) return section;
  return { ...section, enrolled: update.enrolled, capacity: update.capacity, status: update.status, waitlist: { ...update.waitlist } };
}

export function applySeatMerge(term: TermFile, seats: SeatData): TermFile {
  if (!seats || seats.size === 0) return term;
  let changed = false;
  const courses = term.courses.map((course) => {
    let courseChanged = false;
    const sections = course.sections.map((section) => {
      const merged = mergeSectionSeats(section, seats.get(section.id));
      if (merged === section) return section;
      changed = courseChanged = true;
      return merged;
    });
    return courseChanged ? { ...course, sections } : course;
  });
  return changed ? { ...term, courses } : term;
}

/** Serializes a (potentially merged) term to bytes for the engine worker. */
export function seatMergeBytes(term: TermFile): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(term)).buffer as ArrayBuffer;
}

/**
 * The term with the snapshot's seats on top, and when the seats shown are from. A missing, other-term,
 * older-than-daily or unrelated snapshot gives the daily file back.
 */
export function withLiveSeats(current: TermFile, daily: TermFile, snapshot: SeatSnapshot | null): { term: TermFile; seatsUpdatedAt: string } {
  const fallback = { term: daily, seatsUpdatedAt: daily.generatedAt };
  if (!snapshot || snapshot.termId !== daily.term.id || !(Date.parse(snapshot.fetchedAt) >= Date.parse(daily.generatedAt))) return fallback;
  const known = new Set(daily.courses.flatMap((course) => course.sections.map((section) => section.id)));
  if (!snapshot.sections.some((section) => known.has(section.id))) return fallback;
  const seats = new Map(snapshot.sections.map(({ id, ...update }) => [id, update]));
  return { term: applySeatMerge(current, seats), seatsUpdatedAt: snapshot.fetchedAt };
}
