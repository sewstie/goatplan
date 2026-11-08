// @vitest-environment node
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { AuditRequest, AuditSuccess } from "@/lib/engine/types";
import { loadSheet } from "./sheets";

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

describe("DS audit through EngineClient and WebAssembly", () => {
  for (const runtime of ["WebAssembly", "native"]) {
    it.skipIf(runtime === "native" && !process.env.GOATPLAN_NATIVE_CLI)(`checks elective categories only on allocated electives through ${runtime}`, async () => {
      const sheet = await loadSheet("ds-2030");
      const client = clientForAudit();
      try {
        const request: AuditRequest = { version: 1, requirements: sheet.id, sheet,
          taken: ["CS 3431", "DS 4433", "CS 4342", "DS 4342", "MIS 4084", "CS 1101", "CS 1102", "MA 1020", "MA 1021"].map((code) => ({ code, credits: 3 })),
          planned: [{ code: "OIE 4430", credits: 3 }] };
        const response = runtime === "native"
          ? JSON.parse(execFileSync(process.env.GOATPLAN_NATIVE_CLI!, [`${webRoot}public/data/2027-C.json`, "-"], { input: JSON.stringify(request), encoding: "utf8" })) as AuditSuccess
          : await client.audit(request);
        expect(response.ok).toBe(true);
        if (!response.ok) return;
        const lines = response.sections.flatMap((section) => section.lines);
        expect(lines.filter((line) => ["CS 4342", "DS 4342"].includes(line.course ?? ""))).toHaveLength(1);
        expect(lines.filter((line) => line.id >= 22 && line.id <= 26 && ["MA 1020", "MA 1021"].includes(line.course ?? ""))).toHaveLength(1);
        expect(response.sections.find((section) => section.name === "Computer Science Foundation")?.done).toBe(2);
        expect(response.checks.find((check) => check.id === "data-management")).toMatchObject({ state: "met" });
        expect(response.checks.find((check) => check.id === "data-mining")).toMatchObject({ state: "not-met" });
        expect(response.checks.find((check) => check.id === "business-modeling")).toMatchObject({ state: "met" });
        expect(response.checks.find((check) => check.id === "ds-source-review")).toMatchObject({ state: "check" });
      } finally {
        client.dispose();
      }
    });
  }
  for (const name of ["mid", "complete"]) {
    for (const runtime of ["WebAssembly", "native"]) {
      it.skipIf(runtime === "native" && !process.env.GOATPLAN_NATIVE_CLI)(`matches the independently worked ${name} history through ${runtime}`, async () => {
        const fixture = JSON.parse(readFileSync(`${webRoot}../../data/fixtures/ds-2030-${name}.json`, "utf8")) as {
          takenCourses: AuditRequest["taken"];
          plannedCourses: AuditRequest["planned"];
          confirmedManualItems: string[];
          expectedLines: Record<string, { state: string; course?: string | null }>;
          expectedSections: Record<string, { done: number; planned: number; total: number }>;
          expectedChecks: Record<string, string>;
        };
        const sheet = await loadSheet("ds-2030");
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
