import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const root = path.resolve(web, "../..");
const scratch = path.join(root, ".cache/degree-major");
mkdirSync(scratch, { recursive: true });
const target = mkdtempSync(path.join(scratch, "ticket04-fixture-build-"));
cpSync(web, target, { recursive: true, filter: (file) => !["node_modules", ".next", "results", "screenshots"].includes(path.basename(file)) });
symlinkSync(path.join(web, "node_modules"), path.join(target, "node_modules"), "dir");
const registry = path.join(target, "src/lib/degree/sheets/index.ts");
const metadata = {
  id: "fixture-2030", major: "Fixture Engineering", abbreviation: "FE", classYear: 2030,
  source: "https://example.com/fixture.pdf", catalogSource: "https://example.com/catalog",
  status: "beta", verification: null, officialLines: [34, 35, 36],
};
writeFileSync(registry, readFileSync(registry, "utf8")
  .replace("readonly SheetMetadata[] = [{", `readonly SheetMetadata[] = [${JSON.stringify(metadata)}, {`)
  .replace('  "cs-2030": async', '  "fixture-2030": async () => (await import("./fixture-2030.json")).default as TrackingSheet,\n  "cs-2030": async'));
cpSync(path.join(web, "e2e/fixtures/degree-major-sheet.json"), path.join(target, "src/lib/degree/sheets/fixture-2030.json"));
const config = path.join(target, "next.config.ts");
writeFileSync(config, readFileSync(config, "utf8").replace("turbopack: {", `turbopack: { root: ${JSON.stringify(root)},`));
writeFileSync(path.join(scratch, "build-path"), target);
const cli = path.join(root, "node_modules/next/dist/bin/next");
const env = { ...process.env, NEXT_PUBLIC_UMAMI_WEBSITE_ID: "degree-major-test" };
execFileSync(process.execPath, [cli, "build"], { cwd: target, env, stdio: "inherit" });
const server = spawn(process.execPath, [cli, "start", "--port", "4784"], { cwd: target, env, stdio: "inherit" });
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
