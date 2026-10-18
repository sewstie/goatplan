/** Block text shrinks with the hour height: regular ≈67 px, compact ≈57 px, dense ≈41 px per hour (div.app-6.md, div.app-17.md). */
export type Density = "regular" | "compact" | "dense";

export function blockDensity(pixelsPerHour: number | null): Density {
  if (pixelsPerHour === null || pixelsPerHour >= 62) return "regular";
  if (pixelsPerHour >= 48) return "compact";
  return "dense";
}
