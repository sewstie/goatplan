import index from "../../../../public/data/index.json";
import { fetchSeatSnapshot, SEAT_CACHE_SECONDS } from "@/lib/data/seatSource";

const NO_STORE = { "Cache-Control": "no-store" };
const SHARED = { "Cache-Control": `public, max-age=0, s-maxage=${SEAT_CACHE_SECONDS}, stale-while-revalidate=${SEAT_CACHE_SECONDS}` };

export async function GET(request: Request) {
  const termId = new URL(request.url).searchParams.get("term");
  if (!index.terms.some((term) => term.id === termId)) {
    return Response.json({ error: "Choose a published term." }, { status: 400, headers: NO_STORE });
  }
  const snapshot = await fetchSeatSnapshot(termId!).catch(() => null);
  if (!snapshot) return Response.json({ error: "Use the term file's seat counts." }, { status: 503, headers: NO_STORE });
  return Response.json(snapshot, { headers: SHARED });
}
