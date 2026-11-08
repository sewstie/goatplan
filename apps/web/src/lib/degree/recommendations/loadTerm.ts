import { loadTerm } from "@/lib/data/load";
import { loadSeats } from "@/lib/data/loadSeats";
import { withLiveSeats } from "@/lib/data/seatMerge";

export async function loadRecommendationTerm(termId: string) {
  const [daily, seats] = await Promise.all([loadTerm(termId), loadSeats(termId)]);
  return withLiveSeats(daily, daily, seats).term;
}
