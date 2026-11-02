export const CREDITS_PER_UNIT = 9;

const GLYPHS: Record<number, string> = { 3: "1/12", 6: "⅙", 9: "¼", 12: "⅓", 18: "½", 24: "⅔", 27: "¾", 30: "⅚" };

/** "⅓" for 3 credits and "2⅔" for 24. Anything that isn't a clean fraction of a unit falls back to a decimal. */
export function formatUnits(credits: number): string {
  const thirtySixths = (credits / CREDITS_PER_UNIT) * 36;
  const rounded = Math.round(thirtySixths);
  if (Math.abs(rounded - thirtySixths) > 0.01) return String(Math.round((credits / CREDITS_PER_UNIT) * 100) / 100);
  const whole = Math.floor(rounded / 36);
  const rest = rounded - whole * 36;
  if (rest === 0) return String(whole);
  const glyph = GLYPHS[rest];
  if (!glyph) return String(Math.round((credits / CREDITS_PER_UNIT) * 100) / 100);
  return whole > 0 ? `${whole}${glyph}` : glyph;
}

export function unitLabel(credits: number): string {
  return `${formatUnits(credits)} ${credits > CREDITS_PER_UNIT ? "units" : "unit"}`;
}

/** Credits from what a student types: "1/3", "⅓", "1", "1 1/3" or "0.5". Null when it isn't a size a course could be. */
export function parseUnits(text: string): number | null {
  const clean = text.trim();
  const glyph = Object.entries(GLYPHS).find(([, value]) => clean === value || clean.endsWith(value));
  let units: number | null = null;
  const fraction = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(clean);
  if (fraction) {
    const bottom = Number(fraction[3]);
    units = bottom === 0 ? null : Number(fraction[1] ?? 0) + Number(fraction[2]) / bottom;
  } else if (/^(\d+(\.\d+)?|\.\d+)$/.test(clean)) {
    units = Number(clean);
  } else if (glyph) {
    const whole = clean.slice(0, clean.length - glyph[1].length).trim();
    if (whole === "" || /^\d+$/.test(whole)) units = Number(whole || 0) + Number(glyph[0]) / 36;
  }
  if (units === null || !Number.isFinite(units) || units < 0 || units > 30 / CREDITS_PER_UNIT) return null;
  return Math.round(units * CREDITS_PER_UNIT * 100) / 100;
}
