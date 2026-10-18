const COURSE_CODE = /^([a-z]{2,4})[\s._-]*(\d{3,4}[a-z]?)$/i;

/** "cs2102", "CS-2102" and " cs 2102 " all become "CS 2102". Returns null when the text isn't a course code. */
export function normalizeCourseCode(text: string): string | null {
  const match = COURSE_CODE.exec(text.trim());
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

/** Lowercase letters and digits only, so "CS 2102", "cs2102" and "CS-21" compare by prefix. */
export function compactCode(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}
