import type { SectionStatus, Term, Waitlist } from "./types";
import type { SeatUpdate } from "./seatMerge";

export type SeatSection = SeatUpdate & { id: string };

export interface SeatSnapshot {
  termId: string;
  fetchedAt: string;
  sections: SeatSection[];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function fraction(value: unknown): Waitlist | null {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(text(value));
  if (!match) return null;
  const taken = Number(match[1]);
  const capacity = Number(match[2]);
  return Number.isSafeInteger(taken) && Number.isSafeInteger(capacity) ? { taken, capacity } : null;
}

export function parseSeats(raw: unknown, term: Term): SeatSection[] {
  if (!raw || typeof raw !== "object" || !("Report_Entry" in raw) || !Array.isArray(raw.Report_Entry) || raw.Report_Entry.length === 0) {
    throw new Error("WPI's section listing is unavailable.");
  }
  const sections = new Map<string, SeatSection>();
  for (const row of raw.Report_Entry) {
    if (!row || typeof row !== "object") continue;
    const period = /^(\d{4}) \w+ (\w+) Term$/.exec(text(row.Offering_Period));
    if (period) {
      if (`${period[1]}-${period[2]}` !== term.id) continue;
    } else {
      const start = text(row.Course_Section_Start_Date);
      const end = text(row.Course_Section_End_Date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > term.end || end < term.start) continue;
    }
    const course = /^([A-Z]+ [A-Z0-9]+) - .+$/.exec(text(row.Course_Title));
    const section = /^[A-Z]+ [A-Z0-9]+-(.+)$/.exec(text(row.Course_Section));
    if (!course || !section || /^[A-Z0-9]*\s*-\s*Interest List\b|^X\s+cancel/i.test(section[1])) continue;
    const code = section[1].split(" - ")[0].replace(/\(group \d+\)/gi, "").trim();
    const counts = fraction(row.Enrolled_Capacity);
    const waitlist = fraction(row.Waitlist_Waitlist_Capacity);
    const status = text(row.Section_Status).toLowerCase();
    if (!code || !counts || !waitlist || !["open", "closed", "waitlist"].includes(status)) continue;
    const id = `${course[1]}-${code}`;
    if (!sections.has(id)) sections.set(id, { id, status: status as SectionStatus, enrolled: counts.taken, capacity: counts.capacity, waitlist });
  }
  return [...sections.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
