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

describe("ECE audit through EngineClient and WebAssembly", () => {
  for (const runtime of ["WebAssembly", "native"]) {
    it.skipIf(runtime === "native" && !process.env.GOATPLAN_NATIVE_CLI)(`keeps cross-lists single-counted and exclusions out of engineering through ${runtime}`, async () => {
      const sheet = await loadSheet("ece-2030");
      const client = clientForAudit();
      try {
        const request: AuditRequest = { version: 1, requirements: sheet.id, sheet,
          taken: ["BCB 4004", "MA 4603", "BME 4011", "ECE 4011", "CS 2011", "CS 2022", "SS 3043", "ME 1800", "ECE 1799"].map((code) => ({ code, credits: 3 })) };
        const response = runtime === "native"
          ? JSON.parse(execFileSync(process.env.GOATPLAN_NATIVE_CLI!, [`${webRoot}public/data/2027-C.json`, "-"], { input: JSON.stringify(request), encoding: "utf8" })) as AuditSuccess
          : await client.audit(request);
        expect(response.ok).toBe(true);
        if (!response.ok) return;
        const lines = response.sections.flatMap((section) => section.lines);
        expect(lines.filter((line) => ["BCB 4004", "MA 4603"].includes(line.course ?? ""))).toHaveLength(1);
        expect(lines.filter((line) => ["BME 4011", "ECE 4011"].includes(line.course ?? ""))).toHaveLength(1);
        expect(lines.filter((line) => line.id >= 28 && line.course && ["CS 2011", "CS 2022", "SS 3043", "ME 1800", "ECE 1799"].includes(line.course))).toEqual([]);
      } finally {
        client.dispose();
      }
    });
  }
  it("shows ECE math guidance and keeps engineering design unresolved until confirmed", async () => {
    const sheet = await loadSheet("ece-2030");
    activateRequirements(sheet);
    const client = clientForAudit();
    const history = { courses: [{ code: "ECE 2799", credits: 3, title: "", source: "found" as const, status: "taken" as const, apIb: false }], manual: [] };
    try {
      const request: AuditRequest = { version: 1, requirements: sheet.id, sheet, taken: history.courses };
      const result = await client.audit(request);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const view = buildSheet(result, history, new Map(), null);
      expect(view.sections.find((section) => section.id === "math")?.note).toContain("Seven mathematics courses");
      expect(view.sections.flatMap((section) => section.tiles).find((tile) => tile.course === "ECE 2799")?.kind).toBe("check");
      expect(checkRows(result.checks, history).find((row) => row.id === "engineering-design")).toMatchObject({ status: "check", text: expect.stringContaining("lines 44–45") });
      const confirmed = await client.audit({ ...request, manual: ["engineering-design-confirmation"] });
      expect(confirmed.ok && confirmed.checks.find((check) => check.id === "engineering-design")?.state).toBe("met");
    } finally {
      client.dispose();
    }
  });
  for (const name of ["mid", "complete"]) {
    for (const runtime of ["WebAssembly", "native"]) {
      it.skipIf(runtime === "native" && !process.env.GOATPLAN_NATIVE_CLI)(`matches the independently worked ${name} history through ${runtime}`, async () => {
        const fixture = JSON.parse(readFileSync(`${webRoot}../../data/fixtures/ece-2030-${name}.json`, "utf8")) as {
          takenCourses: AuditRequest["taken"];
          plannedCourses: AuditRequest["planned"];
          confirmedManualItems: string[];
          expectedLines: Record<string, { state: string; course?: string | null }>;
          expectedSections: Record<string, { done: number; planned: number; total: number }>;
          expectedChecks: Record<string, string>;
        };
        const sheet = await loadSheet("ece-2030");
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
});
