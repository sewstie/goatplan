import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";

const dataDir = new URL("../../apps/web/public/data/", import.meta.url);
const files = readdirSync(dataDir).filter((name) => /^\d{4}-[A-Z][A-Z0-9]*\.json$/.test(name));

describe("published term files", () => {
  for (const name of files.sort()) {
    it(`${name} has no option with overlapping sections`, () => {
      const file = JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));
      for (const course of file.courses) {
        const sections = new Map(course.sections.map((section) => [section.id, section]));
        for (const option of course.options) {
          const meetings = option.flatMap((id) => {
            assert.ok(sections.has(id), `${name}: missing section ${id}`);
            return sections.get(id).meetings.map((meeting) => ({ ...meeting, section: id }));
          });
          for (let i = 0; i < meetings.length; i++) {
            for (const b of meetings.slice(i + 1)) {
              const a = meetings[i];
              if (a.section === b.section) continue;
              const sharedDays = a.days.filter((day) => b.days.includes(day));
              if (sharedDays.length === 0) continue;
              assert.ok(
                a.end <= b.start || b.end <= a.start,
                `${name}: ${a.section} and ${b.section} overlap on ${sharedDays.join(", ")}`,
              );
            }
          }
        }
      }
    });
  }
});
