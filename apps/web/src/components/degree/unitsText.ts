import { formatUnits } from "@/lib/degree";

const FRACTIONS: Record<string, string> = { "⅙": "1/6", "¼": "1/4", "⅓": "1/3", "½": "1/2", "⅔": "2/3", "¾": "3/4", "⅚": "5/6" };

export function unitsText(credits: number): string {
  return formatUnits(credits).replace(/^(\d*)([⅙¼⅓½⅔¾⅚])$/, (_, whole: string, glyph: string) => `${whole ? `${whole} ` : ""}${FRACTIONS[glyph]}`);
}
