import { defineConfig } from "@playwright/test";

process.env.GOATPLAN_MAJOR_FIXTURES = "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "degree-major-fixtures.spec.ts",
  outputDir: "./e2e/results/major-fixtures",
  reporter: "list",
  use: { baseURL: "http://localhost:4784" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "touch", use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
  ],
  webServer: { command: "node e2e/fixtures/degreeMajorBuild.mjs", url: "http://localhost:4784", timeout: 180_000 },
});
