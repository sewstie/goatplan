/** How much of a class block's text fits: code, time and room, or just code and time. */
export type Density = "regular" | "compact";

const REGULAR_PX = 52;

export function blockDensity(heightPx: number | null): Density {
  return heightPx === null || heightPx >= REGULAR_PX ? "regular" : "compact";
}
