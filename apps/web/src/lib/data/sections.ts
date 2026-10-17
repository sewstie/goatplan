import type { Section, SectionType } from "./types";

const TYPE_NAMES: Readonly<Record<SectionType, string>> = {
  lecture: "lecture",
  lab: "lab",
  discussion: "discussion",
  seminar: "seminar",
  workshop: "workshop",
  other: "section",
};

/** "lecture" → "Lecture", as in "Lecture CL01" and "Lab · 4 open". */
export function sectionTypeName(type: SectionType): string {
  const name = TYPE_NAMES[type];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** "BS02 discussion". Sections of type "other" show only their code. */
export function sectionLabel(section: Pick<Section, "code" | "type">): string {
  return section.type === "other" ? section.code : `${section.code} ${TYPE_NAMES[section.type]}`;
}
