import { defineConfig } from "@playwright/test";

process.env.GOATPLAN_RELEASE_FIXTURES = "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "degree-release-fixtures.spec.ts",
  outputDir: "./e2e/results/release-fixtures",
  reporter: "list",
  use: { baseURL: "http://localhost:4789" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 834, height: 1000 } } },
  ],
  webServer: { command: "node e2e/fixtures/degreeReleaseBuild.mjs", url: "http://localhost:4789", timeout: 180_000 },
});
