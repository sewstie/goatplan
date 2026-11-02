import { formatTimeShort } from "@/lib/data/time";

export interface ShareSummaryInput {
  courses: readonly string[];
  locks: Readonly<Record<string, readonly string[]>>;
  professorByCourse: Readonly<Record<string, string | null | undefined>>;
  preferences: { startsAfter: number; onlyOpen: boolean; blocked: readonly unknown[] };
}

export interface ShareSummary {
  courses: string;
  sections: string;
  professors: string;
  preferences: string;
  blocked: string;
}

const sectionCode = (course: string, id: string) => (id.startsWith(`${course}-`) ? id.slice(course.length + 1) : id);

/** What a share link holds, in the words the Share screen uses. It never touches blocked-time names. */
export function shareSummary({ courses, locks, professorByCourse, preferences }: ShareSummaryInput): ShareSummary {
  const locked = courses.flatMap((course) => (locks[course] ?? []).map((id) => sectionCode(course, id)));
  const names = courses.map((course) => professorByCourse[course]).filter((name): name is string => Boolean(name));
  const blocks = preferences.blocked.length;
  return {
    courses: `${courses.length} ${courses.length === 1 ? "course" : "courses"} · selected sections included`,
    sections: locked.length > 0 ? `${locked.join(" · ")} locked` : "None locked",
    professors: names.length > 0 ? [...new Set(names)].join(", ") : "Any professor",
    preferences: `${preferences.startsAfter > 0 ? `${formatTimeShort(preferences.startsAfter)} start` : "Any start"} · ${preferences.onlyOpen ? "only open" : "full sections too"}`,
    blocked: blocks > 0 ? `${blocks} ${blocks === 1 ? "block" : "blocks"} · names hidden` : "None",
  };
}
