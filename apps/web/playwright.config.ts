import { defineConfig, devices } from "@playwright/test";

const productionUrl = "http://localhost:3100";
const devUrl = "http://localhost:3101";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/results",
  reporter: "list",
  use: devices["Desktop Chrome"],
  projects: [
    { name: "production", testMatch: "shell.spec.ts", use: { baseURL: productionUrl } },
    // /dev pages 404 in production, so they are tested on the dev server.
    { name: "dev-pages", testMatch: "primitives.spec.ts", use: { baseURL: devUrl } },
  ],
  webServer: [
    {
      command: "npm run build && npm run start -- --port 3100",
      url: productionUrl,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: "npm run dev -- --port 3101",
      url: `${devUrl}/dev/ui`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
