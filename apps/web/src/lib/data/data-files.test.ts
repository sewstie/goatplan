// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Day, Delivery, Level, SectionStatus, SectionType, TermFile, TermIndex } from "./types";

// Checks the published files against the types, so a format change shows up here first.

const dataDir = fileURLToPath(new URL("../../../public/data/", import.meta.url));
const read = <T,>(name: string): T => JSON.parse(readFileSync(`${dataDir}${name}`, "utf8")) as T;

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const types: SectionType[] = ["lecture", "lab", "discussion", "seminar", "workshop", "other"];
const statuses: SectionStatus[] = ["open", "closed", "waitlist"];
const deliveries: Delivery[] = ["in-person", "hybrid", "online", "online-sync", "online-async"];
const levels: Level[] = ["Undergraduate", "Graduate"];

const index = read<TermIndex>("index.json");

describe("index.json", () => {
  it("lists terms with the fields the term picker needs", () => {
    expect(index.terms.length).toBeGreaterThan(0);
    for (const term of index.terms) {
      expect(term.id).toMatch(/^\d{4}-[A-Z]$/);
      expect(["upcoming", "in-progress"]).toContain(term.status);
      expect(term.start < term.end).toBe(true);
      expect(term.courses).toBeGreaterThan(0);
    }
  });
});

describe.each(index.terms.map((term) => term.id))("%s.json", (termId) => {
  const file = read<TermFile>(`${termId}.json`);

  it("matches its index entry", () => {
    const summary = index.terms.find((term) => term.id === termId)!;
    expect(file.term).toEqual({
      id: summary.id,
      name: summary.name,
      season: summary.season,
      year: summary.year,
      start: summary.start,
      end: summary.end,
    });
    expect(file.courses).toHaveLength(summary.courses);
  });

  it("only uses the documented values", () => {
    for (const course of file.courses) {
      expect(levels).toContain(course.level);
      expect(course.credits === null || typeof course.credits === "number").toBe(true);
      const ids = new Set(course.sections.map((section) => section.id));
      for (const option of course.options) {
        for (const id of option) expect(ids.has(id)).toBe(true);
      }
      for (const section of course.sections) {
        expect(types).toContain(section.type);
        expect(statuses).toContain(section.status);
        expect(deliveries).toContain(section.delivery);
        expect(Array.isArray(section.instructors)).toBe(true);
        for (const meeting of section.meetings) {
          expect(meeting.start).toBeLessThan(meeting.end);
          expect(typeof meeting.location).toBe("string");
          for (const day of meeting.days) expect(days).toContain(day);
        }
      }
    }
  });

  it("has no option with overlapping sections", () => {
    for (const course of file.courses) {
      const sections = new Map(course.sections.map((section) => [section.id, section]));
      for (const option of course.options) {
        const meetings = option.flatMap((id) =>
          sections.get(id)!.meetings.map((meeting) => ({ ...meeting, section: id })),
        );
        for (let i = 0; i < meetings.length; i++) {
          for (const b of meetings.slice(i + 1)) {
            const a = meetings[i];
            if (a.section === b.section) continue;
            const sharedDays = a.days.filter((day) => b.days.includes(day));
            if (sharedDays.length === 0) continue;
            expect(
              Math.min(a.end, b.end),
              `${a.section} and ${b.section} overlap on ${sharedDays.join(", ")}`,
            ).toBeLessThanOrEqual(Math.max(a.start, b.start));
          }
        }
      }
    }
  });
});
