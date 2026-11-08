import { unstable_cache } from "next/cache";
import index from "../../../public/data/index.json";
import { parseSeats, type SeatSection, type SeatSnapshot } from "./seatParser";
import type { Term } from "./types";

export const SEAT_SOURCE_URL = "https://courselistings.wpi.edu/assets/prod-data.json";
export const SEAT_CACHE_SECONDS = 900;

interface SeatListing {
  fetchedAt: string;
  terms: Record<string, SeatSection[]>;
}

const publishedTerms: Term[] = index.terms;
let inFlight: Promise<SeatListing | null> | null = null;

async function requestListing(): Promise<SeatListing | null> {
  try {
    const response = await fetch(SEAT_SOURCE_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "GoatPlan course planner (student project)" },
    });
    if (!response.ok) return null;
    const raw: unknown = await response.json();
    const terms = Object.fromEntries(publishedTerms.map((term) => [term.id, parseSeats(raw, term)]));
    if (Object.values(terms).every((sections) => sections.length === 0)) return null;
    return { fetchedAt: new Date().toISOString(), terms };
  } catch {
    return null;
  }
}

/** One WPI request at a time: everyone who asks while it runs gets the same answer. */
export function sharedListing(): Promise<SeatListing | null> {
  inFlight ??= requestListing().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

// A failed request is cached too, so an outage at WPI doesn't turn into one request per visitor.
const cachedListing = unstable_cache(sharedListing, ["seats-v2"], { revalidate: SEAT_CACHE_SECONDS });

export async function fetchSeatSnapshot(termId: string): Promise<SeatSnapshot | null> {
  const listing = await cachedListing();
  const sections = listing?.terms[termId];
  if (!listing || !sections || sections.length === 0) return null;
  return { termId, fetchedAt: listing.fetchedAt, sections };
}
