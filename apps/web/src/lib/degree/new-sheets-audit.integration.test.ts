// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { AuditRequest } from "@/lib/engine/types";
import { loadSheet, SHEETS } from "./sheets";
import { validateSheet } from "./sheets/validation";
import { activateRequirements } from "./requirements";
import { buildSheet } from "./sheet";
import { creditsPerTerm } from "./insights";

const webRoot = fileURLToPath(new URL("../../../", import.meta.url));
const ids = ["bbt", "bc", "ch", "bcb", "eve", "baaai", "mkt", "pw", "mac", "ae-aero", "ae-astro", "aren", "ai", "bme"];

interface WorkedHistory {
  sheetId: string;
  takenCourses: AuditRequest["taken"];
  plannedCourses: AuditRequest["planned"];
  confirmedManualItems: string[];
  expectedSections: Record<string, { done: number; planned: number }>;
  expectedChecks: Record<string, string>;
  unfilledLines: number[];
  expectedFreeCreditsDone?: number;
}

function auditClient() {
  const host = createEngineHost({
    async loadModule() {
      const engineModule = await import(/* @vite-ignore */ pathToFileURL(`${webRoot}public/engine/goatplan.mjs`).href);
      return await engineModule.default() as GoatplanModule;
    },
    async fetchTermText(id) { return readFileSync(`${webRoot}public/data/${id}.json`, "utf8"); },
  });
  const worker: EngineWorker = {
    onmessage: null, onerror: null,
    postMessage(message) {
      void host.handle(message).then((reply) => worker.onmessage?.({ data: reply } as MessageEvent));
    },
    terminate() {},
  };
  return new EngineClient(() => worker);
}

describe("new Class of 2030 PDF sheets", () => {
  for (const id of ids) {
    for (const history of ["mid", "edge"]) {
      it(`${id} matches the hand-worked ${history} history through EngineClient/WASM`, async () => {
        const fixture = JSON.parse(readFileSync(`${webRoot}../../data/fixtures/${id}-2030-${history}.json`, "utf8")) as WorkedHistory;
        const sheet = await loadSheet(fixture.sheetId);
        const metadata = SHEETS.find((item) => item.id === sheet.id)!;
        expect(metadata).toMatchObject({ status: "beta", verification: null, classYear: 2030 });
        expect(validateSheet(sheet, metadata)).toEqual([]);
        expect(sheet.checks.find((check) => check.id === "hua-ap-credit")).toMatchObject({ type: "manual" });
        expect(sheet.checks.some((check) => check.type === "apIbLimit")).toBe(false);
        if (id === "pw") {
          expect(sheet.residencyUnits).toBeUndefined();
          expect(sheet.checks.some((check) => check.type === "residency")).toBe(false);
        }
        const client = auditClient();
        try {
          const response = await client.audit({ version: 1, requirements: sheet.id, sheet,
            taken: fixture.takenCourses, planned: fixture.plannedCourses, manual: fixture.confirmedManualItems });
          expect(response.ok).toBe(true);
          if (!response.ok) return;
          if (fixture.expectedFreeCreditsDone !== undefined) {
            expect(response.freeElectives.creditsDone).toBe(fixture.expectedFreeCreditsDone);
          }
          activateRequirements(sheet);
          if (id === "mac") {
            const credits = creditsPerTerm({ courses: [{ code: "MA 4216", credits: 3, title: "Seminar", status: "taken", source: "typed", apIb: false }], manual: [] }, null);
            expect(credits.noTerm.done).toBe(0);
          }
          const view = buildSheet(response, { courses: [], manual: [] }, new Map(), null);
          if (id === "pw") {
            expect(view.sections.find((section) => section.id === "wpe")?.tiles.map((tile) => tile.detail)).toEqual([
              "42a · 1/12 unit", "42b · 1/12 unit", "42c · 1/12 unit", "42d · 1/12 unit",
            ]);
          }
          if (["bcb", "eve", "baaai", "mkt"].includes(id)) {
            expect(view.sections.find((section) => section.id === "math")?.note).not.toContain("Four 1000-level math courses maximum");
          }
          for (const [name, expected] of Object.entries(fixture.expectedSections)) {
            expect(response.sections.find((section) => section.name === name), name).toMatchObject(expected);
          }
          const lines = response.sections.flatMap((section) => section.lines);
          for (const id of fixture.unfilledLines) {
            expect(lines.find((line) => line.id === id), `line ${id}`).toMatchObject({ state: "empty" });
          }
          for (const [id, state] of Object.entries(fixture.expectedChecks)) {
            expect(response.checks.find((check) => check.id === id), id).toMatchObject({ state });
          }
        } finally {
          client.dispose();
        }
      });
    }
  }
});
