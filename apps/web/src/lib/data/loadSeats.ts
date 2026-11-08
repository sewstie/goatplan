import { isTermId } from "./load";
import type { SeatSnapshot } from "./seatParser";

export const SEAT_POLL_MS = 60_000;

const STATUSES = ["open", "closed", "waitlist"];
const isCount = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;

/** Live seat counts from /api/seats, or null when they can't be had and the daily file has to do. */
export async function loadSeats(termId: string): Promise<SeatSnapshot | null> {
  if (!isTermId(termId)) return null;
  try {
    const response = await fetch(`/api/seats?term=${termId}`, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.termId !== termId || !Number.isFinite(Date.parse(data.fetchedAt)) || !Array.isArray(data.sections)) return null;
    for (const section of data.sections) {
      if (!section || typeof section.id !== "string" || !STATUSES.includes(section.status) || !isCount(section.enrolled) || !isCount(section.capacity) || !isCount(section.waitlist?.taken) || !isCount(section.waitlist?.capacity)) return null;
    }
    return data as SeatSnapshot;
  } catch {
    return null;
  }
}
