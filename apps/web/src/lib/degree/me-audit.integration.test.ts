// @vitest-environment node
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { AuditRequest, AuditSuccess } from "@/lib/engine/types";
import { loadSheet } from "./sheets";
import { activateRequirements } from "./requirements";
import { buildSheet } from "./sheet";
import { checkRows } from "./insights";

const webRoot = fileURLToPath(new URL("../../../", import.meta.url));

function clientForAudit() {
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

describe("ME audit through EngineClient and WebAssembly", () => {
  for (const name of ["mid", "complete"]) {
    for (const runtime of ["WebAssembly", "native"]) {
      it.skipIf(runtime === "native" && !process.env.GOATPLAN_NATIVE_CLI)(`matches the independently worked ${name} history through ${runtime}`, async () => {
        const fixture = JSON.parse(readFileSync(`${webRoot}../../data/fixtures/me-2030-${name}.json`, "utf8")) as {
          takenCourses: AuditRequest["taken"];
          plannedCourses: AuditRequest["planned"];
          confirmedManualItems: string[];
          expectedLines: Record<string, { state: string; course?: string | null }>;
          expectedSections: Record<string, { done: number; planned: number; total: number }>;
          expectedChecks: Record<string, string>;
        };
        const sheet = await loadSheet("me-2030");
        const client = clientForAudit();
        try {
          const request: AuditRequest = { version: 1, requirements: sheet.id, sheet, taken: fixture.takenCourses, planned: fixture.plannedCourses, manual: fixture.confirmedManualItems };
          const response = runtime === "native"
            ? JSON.parse(execFileSync(process.env.GOATPLAN_NATIVE_CLI!, [`${webRoot}public/data/2027-C.json`, "-"], { input: JSON.stringify(request), encoding: "utf8" })) as AuditSuccess
            : await client.audit(request);
          expect(response.ok).toBe(true);
          if (!response.ok) return;
          const lines = response.sections.flatMap((section) => section.lines);
          for (const [id, expected] of Object.entries(fixture.expectedLines)) expect(lines.find((line) => line.id === Number(id)), `line ${id}`).toMatchObject(expected);
          for (const [name, expected] of Object.entries(fixture.expectedSections)) expect(response.sections.find((section) => section.name === name), name).toMatchObject(expected);
          for (const [id, state] of Object.entries(fixture.expectedChecks)) expect(response.checks.find((check) => check.id === id), id).toMatchObject({ state });
        } finally {
          client.dispose();
        }
      });
    }
  }
  it("counts science thermodynamics once and requires explicit review of its extra engineering credit", async () => {
    const client = clientForAudit();
    try {
      const sheet = await loadSheet("me-2030");
      const request: AuditRequest = { version: 1, requirements: sheet.id, sheet, taken: [{ code: "CH 3510", credits: 3 }] };
      const response = await client.audit(request);
      expect(response.ok).toBe(true);
      if (!response.ok) return;
      activateRequirements(sheet);
      const view = buildSheet(response, { courses: [], manual: [] }, new Map(), null);
      expect(view.sections.flatMap((section) => section.tiles).find((tile) => tile.line === 31)?.label).toBe("Thermodynamics review");
      expect(view.sections.find((section) => section.id === "thermal")?.note).toContain("Add ES 3001 as a course");
      const lines = response.sections.flatMap((section) => section.lines);
      expect(lines.filter((line) => line.course === "CH 3510")).toHaveLength(1);
      expect(lines.find((line) => line.id === 31)).toMatchObject({ state: "empty", course: null });
      expect(response.checks.find((check) => check.id === "thermodynamics-credit")?.state).toBe("check");
      const confirmed = await client.audit({ ...request, manual: ["science-thermodynamics-substitution"] });
      expect(confirmed.ok).toBe(true);
      if (!confirmed.ok) return;
      expect(confirmed.sections.flatMap((section) => section.lines).find((line) => line.id === 31)).toMatchObject({ state: "done", course: null });
      expect(confirmed.checks.find((check) => check.id === "thermodynamics-credit")?.state).toBe("check");
    } finally {
      client.dispose();
    }
  });
  it("keeps elective eligibility visibly unresolved until the student confirms it", async () => {
    const client = clientForAudit();
    try {
      const sheet = await loadSheet("me-2030");
      activateRequirements(sheet);
      const history = { courses: [{ code: "ME 1800", credits: 3, title: "", source: "found" as const, inProgress: false, apIb: false }], manual: [] };
      const request: AuditRequest = { version: 1, requirements: sheet.id, sheet, taken: history.courses };
      const response = await client.audit(request);
      expect(response.ok).toBe(true);
      if (!response.ok) return;
      expect(checkRows(response.checks, history).find((row) => row.id === "elective-distribution")).toMatchObject({ status: "check", text: expect.stringContaining("ME 2000/3000") });
      const tile = buildSheet(response, history, new Map(), null).sections.flatMap((section) => section.tiles).find((tile) => tile.course === "ME 1800");
      expect(tile?.kind).toBe("check");
      const confirmed = await client.audit({ ...request, manual: ["elective-distribution-confirmation"] });
      expect(confirmed.ok && confirmed.checks.find((check) => check.id === "elective-distribution")?.state).toBe("met");
    } finally {
      client.dispose();
    }
  });
});
