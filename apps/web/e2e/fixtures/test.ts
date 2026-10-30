import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect } from "@playwright/test";
import type { TermFile } from "../../src/lib/data/types";

/** A copy of public/data from 2026-10-29, so the daily data update can't break e2e. */
const dataDir = path.join(__dirname, "data");

export function frozenTerm(id: string): TermFile {
  return JSON.parse(readFileSync(path.join(dataDir, `${id}.json`), "utf8"));
}

// A context route, so any page.route in a spec still wins over it.
export const test = base.extend<{ frozenData: void }>({
  frozenData: [async ({ context }, use) => {
    await context.route(/\/data\/[^/?]+\.json(\?.*)?$/, (route) => {
      const file = path.join(dataDir, path.basename(new URL(route.request().url()).pathname));
      return existsSync(file) ? route.fulfill({ path: file }) : route.fulfill({ status: 404 });
    });
    await use();
  }, { auto: true }],
});

export { expect };
