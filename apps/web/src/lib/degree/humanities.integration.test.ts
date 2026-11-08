// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { AuditSuccess } from "@/lib/engine/types";
import { applyHuaPath, detectHuaPath } from "./humanities";
import { typedCourse } from "./history";
import { loadSheet, SHEETS } from "./sheets";

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

const GERMAN = ["GN 1511", "GN 1512", "GN 2511", "GN 2512", "GN 3511", "GN 3512"];

async function humanities(sheetId: string, codes: string[], language: boolean) {
  const sheet = await loadSheet(sheetId);
  const courses = codes.map((code) => ({ ...typedCourse(code), source: "found" as const }));
  const path = language ? detectHuaPath(courses).path : { kind: "depth-breadth" as const };
  const client = clientForAudit();
  try {
    const response = await client.audit({ version: 1, requirements: sheet.id, sheet: applyHuaPath(sheet, path), taken: codes.map((code) => ({ code, credits: 3 })), planned: [] }) as AuditSuccess;
    expect(response.ok).toBe(true);
    const hua = response.sections.flatMap((section) => section.lines).filter((line) => sheet.lines.find((item) => item.line === line.id)?.section === "hua");
    return { lines: hua, checks: response.checks.filter((check) => check.id.startsWith("hua")) };
  } finally {
    client.dispose();
  }
}

describe("humanities language path through WebAssembly", () => {
  for (const { id } of SHEETS) {
    it(`six German courses ending in GN 3512 finish humanities on ${id}`, async () => {
      const { lines, checks } = await humanities(id, GERMAN, true);
      expect(lines.map((line) => line.state)).toEqual(Array(6).fill("done"));
      expect(checks.map((check) => check.id)).not.toContain("hua-depth");
      expect(checks.map((check) => check.id)).not.toContain("hua-breadth");
    });
  }

  it("without the language path, the same German courses leave the seminar line empty", async () => {
    const { lines, checks } = await humanities("cs-2030", GERMAN, false);
    expect(lines.filter((line) => line.state === "empty")).toHaveLength(1);
    expect(checks.find((check) => check.id === "hua-breadth")?.state).toBe("check");
  });

  it("on the language path, a sixth course below 3000 doesn't finish it", async () => {
    const { lines } = await humanities("cs-2030", ["GN 1511", "GN 1512", "GN 1513", "GN 2511", "GN 2512", "GN 2513"], true);
    expect(lines.filter((line) => line.state === "done")).toHaveLength(5);
  });
});
