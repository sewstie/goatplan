import { defineConfig, devices } from "@playwright/test";

// Each agent works in its own worktree with its own PORT (3001–3004), so parallel runs never collide.
// PORT is the agent's dev server (`npm run dev` reads it too); the production build for the tests
// runs on PORT + 1000.
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 64535) {
  throw new Error(`PORT must be a port number below 64536, not "${process.env.PORT}".`);
}
const productionPort = port + 1000;
const devUrl = `http://localhost:${port}`;
const productionUrl = `http://localhost:${productionPort}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/results",
  reporter: "list",
  use: devices["Desktop Chrome"],
  projects: [
    // Every spec runs against the production build, except the /dev page specs: those pages 404 in production.
    { name: "production", testIgnore: /(primitives|engine|phone)\.spec\.ts/, use: { baseURL: productionUrl } },
    // The phone shell specs run below the tablet breakpoint (640px) on a phone-sized viewport.
    {
      name: "phone",
      testMatch: /phone\.spec\.ts/,
      use: {
        baseURL: productionUrl,
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
        userAgent: devices["iPhone 13"].userAgent,
      },
    },
    { name: "dev-pages", testMatch: /(primitives|engine)\.spec\.ts/, use: { baseURL: devUrl } },
  ],
  webServer: [
    {
      // Always a fresh build, never a server left over from another run.
      command: `npm run build && npm run start -- --port ${productionPort}`,
      url: productionUrl,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      // Next allows one dev server per worktree, so a running `npm run dev` on PORT is reused.
      command: `npm run dev -- --port ${port}`,
      url: `${devUrl}/dev/ui`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
