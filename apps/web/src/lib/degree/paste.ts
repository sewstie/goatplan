import { cleanCourseCode } from "./history";
import { parseTerm, termLong, type TermName } from "./terms";

const CODE_SHAPED = /(?<![a-z0-9])[a-z]{2,4}(?:[^\S\r\n]|[._\-–—])*\d{3,4}[a-z]?(?![a-z0-9])/gi;

// Grades, dates and everyday words a number can follow. No WPI subject uses any of these.
const NOT_SUBJECTS = new Set(
  `JAN FEB MAR APR MAY JUN JUL AUG SEP SEPT OCT NOV DEC
   FALL SPR SPRG SUM WIN WINT TERM YEAR DATE ROOM PAGE WEEK UNIT
   MON TUE TUES WED THU THUR FRI SAT SUN AM PM
   NR NC TR WD IP AU CR
   IN ON OF TO AT BY OR AND THE FOR
   WPI BS MS BA PHD`.split(/\s+/),
);

export function parsePastedCodes(text: string): string[] {
  const codes = new Set<string>();
  for (const [shaped] of text.matchAll(CODE_SHAPED)) {
    const code = cleanCourseCode(shaped.replace(/[–—]/g, "-"));
    if (code && !NOT_SUBJECTS.has(code.split(" ")[0])) codes.add(code);
  }
  return [...codes];
}

export interface PastedCourse {
  code: string;
  term?: string;
  inProgress: boolean;
}

const TERM_SHAPED = /\b([A-E])[ -]?(?:term)?[ -]?'?((?:20)?\d{2})\b/gi;
const IN_PROGRESS = /\bin[\s-]progress\b/i;

function termLines(text: string): { term: string; start: number }[] {
  const lines: { term: string; start: number }[] = [];
  let start = 0;
  for (const line of text.split("\n")) {
    const term = parseTerm(line);
    if (term) lines.push({ term: termLong(term), start });
    start += line.length + 1;
  }
  return lines;
}

function termLayout(lines: readonly { start: number }[], courses: readonly { start: number }[]): "headings" | "under" | "unclear" {
  if (lines.length === 0 || courses.length === 0 || lines[0].start > courses[0].start) return "under";
  const everyHeadingHasCourses = lines.every((line, index) => courses.some((course) => course.start > line.start && course.start < (lines[index + 1]?.start ?? Infinity)));
  return everyHeadingHasCourses ? "headings" : "unclear";
}

export function parsePastedCourses(text: string): PastedCourse[] {
  const found = [...text.matchAll(CODE_SHAPED)].flatMap((match) => {
    const code = cleanCourseCode(match[0].replace(/[–—]/g, "-"));
    return code && !NOT_SUBJECTS.has(code.split(" ")[0]) ? [{ code, start: match.index, end: match.index + match[0].length }] : [];
  });
  const lines = termLines(text);
  const layout = termLayout(lines, found);
  const courses = new Map<string, PastedCourse>();
  found.forEach((item, index) => {
    if (courses.has(item.code)) return;
    const after = text.slice(item.end, found[index + 1]?.start ?? text.length);
    const sameLine = layout === "under" ? after : after.split("\n")[0];
    const beside = [...sameLine.matchAll(TERM_SHAPED)][0];
    const under = layout === "headings" ? lines.findLast((line) => line.start < item.start)?.term : undefined;
    const term = beside ? termLong({ letter: beside[1].toUpperCase() as TermName["letter"], year: beside[2].length === 2 ? 2000 + Number(beside[2]) : Number(beside[2]) }) : under;
    courses.set(item.code, {
      code: item.code,
      ...(term ? { term } : {}),
      inProgress: IN_PROGRESS.test(sameLine),
    });
  });
  return [...courses.values()];
}
