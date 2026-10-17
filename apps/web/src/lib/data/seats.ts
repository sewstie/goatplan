import type { Section } from "./types";

type Seats = Pick<Section, "enrolled" | "capacity">;

/** Capacity minus enrolled, never below 0 for over-enrolled sections. */
export function openSeats(section: Seats): number {
  return Math.max(0, section.capacity - section.enrolled);
}

/** The open seats of an option are the lowest among its sections. */
export function optionOpenSeats(sections: readonly Seats[]): number {
  if (sections.length === 0) return 0;
  return Math.min(...sections.map(openSeats));
}

export function isFull(section: Seats): boolean {
  return openSeats(section) === 0;
}

/** "36 of 120 open", or "36 of 120 seats open" with `{ seats: true }`. */
export function formatOpenSeats(section: Seats, options: { seats?: boolean } = {}): string {
  const noun = options.seats ? " seats" : "";
  return `${openSeats(section)} of ${section.capacity}${noun} open`;
}

/** "7 of 15 on waitlist" */
export function formatWaitlist(section: Pick<Section, "waitlist">): string {
  return `${section.waitlist.taken} of ${section.waitlist.capacity} on waitlist`;
}
