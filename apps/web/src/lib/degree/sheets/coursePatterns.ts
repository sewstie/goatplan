import type { TrackingSheet } from "./types";

const expanded = new Map<string, string[]>();

export function expandCoursePattern(pattern: string): string[] {
  const cached = expanded.get(pattern);
  if (cached) return cached;
  const subject = /^([A-Z]{2,4}) /.exec(pattern)?.[1];
  if (!subject) throw new Error(`Invalid course pattern: ${pattern}`);
  const matches = new RegExp(`^(?:${pattern})$`);
  const courses: string[] = [];
  for (let number = 100; number <= 9999; number++) {
    const code = `${subject} ${number}`;
    if (matches.test(code)) courses.push(code);
    if (number < 1000) {
      for (const suffix of ["A", "B", "C", "D"]) {
        if (matches.test(`${code}${suffix}`)) courses.push(`${code}${suffix}`);
      }
    }
  }
  if (!courses.length) throw new Error(`Empty course pattern: ${pattern}`);
  expanded.set(pattern, courses);
  return courses;
}

export function expandSheetPatterns(sheet: TrackingSheet): TrackingSheet {
  if (!sheet.lines.some((line) => line.filter.coursePatterns)) return sheet;
  return {
    ...sheet,
    lines: sheet.lines.map((line) => {
      const { coursePatterns, ...filter } = line.filter;
      if (!coursePatterns) return line;
      return { ...line, filter: { ...filter, courses: [...new Set([
        ...(filter.courses ?? []), ...coursePatterns.flatMap(expandCoursePattern),
      ])] } };
    }),
  };
}
