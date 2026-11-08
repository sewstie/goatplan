import type { Course, Section } from "@/lib/data/types";

export type DescriptionPart = { label?: string; text: string };

export type DescribedText = { offered: string | null; parts: DescriptionPart[] };

export type Topic = DescribedText & { section: string; title: string };

const OFFERED: Record<string, string> = {
  I: "Offered every year",
  II: "Offered at least every other year",
  III: "Offered only when enough students need it",
};

const CATEGORY = /^Cat\.\s?(III|II|I)(?![A-Za-z])[.,]?\s*/;
const LABELS = "Recommended background|Suggested background|Note";
const BREAK = new RegExp(`\\s+(?=(?:${LABELS}):|Students may not receive credit|This course will be offered)`, "i");
const LABEL = new RegExp(`^(${LABELS}):\\s*`, "i");

/** WPI's description as a category line and short paragraphs. */
export function describeText(raw: string): DescribedText {
  const text = raw.trim();
  const category = text.match(CATEGORY);
  const body = category ? text.slice(category[0].length) : text;
  const parts = body
    .split(BREAK)
    .filter(Boolean)
    .map((part) => {
      const label = part.match(LABEL);
      return label ? { label: label[1], text: part.slice(label[0].length) } : { text: part };
    });
  return { offered: category ? OFFERED[category[1]] : null, parts };
}

/** The course's description plus the topics of the given sections, like HU 3900's seminars. */
export function describeCourse(course: Pick<Course, "description">, sections: readonly Section[]): DescribedText & { topics: Topic[] } {
  const seen = new Set<string>();
  const topics = sections.flatMap((section) => {
    if (!section.description || seen.has(section.description)) return [];
    seen.add(section.description);
    return [{ section: section.code, title: section.title ?? "", ...describeText(section.description) }];
  });
  return { ...describeText(course.description), topics };
}
