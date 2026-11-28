import { expect, test } from "./fixtures/test";
import { auditReady } from "./fixtures/degree";

const majors = [
  ["mac", "Actuarial Mathematics"],
  ["ae-aero", "Aerospace Engineering, Aeronautical"],
  ["ae-astro", "Aerospace Engineering, Astronautical"],
  ["aren", "Architectural Engineering"],
  ["ai", "Artificial Intelligence"],
  ["bme", "Biomedical Engineering"],
];

for (const width of [1440, 834]) {
  test(`six sheets and engineering maps at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() =>
      localStorage.setItem("goatplan:tutorial:v1", "dismissed"),
    );
    await page.goto("/degree");
    for (const [index, [id, name]] of majors.entries()) {
      if (index > 0)
        await page.getByRole("button", { name: "Change major" }).click();
      const radio = page.getByRole("radio", { name, exact: true });
      await radio.focus();
      await page.keyboard.press("Space");
      await expect(radio).toBeChecked();
      await page.getByRole("button", { name: "Open my sheet" }).click();
      await auditReady(page);
      await expect(page.locator(".degree-major")).toContainText(name);
      await page.screenshot({
        path: `e2e/screenshots/degree-six-${id}-${width}.png`,
        fullPage: true,
      });
      const map = page.getByRole("button", { name: "Course map", exact: true });
      if (["mac", "ai"].includes(id)) await expect(map).toHaveCount(0);
      else {
        await map.click();
        await expect(
          page.getByRole("heading", { name: "Course map", exact: true }),
        ).toBeVisible();
        await expect(page.locator(".flow-surface")).toBeVisible();
        await page.screenshot({
          path: `e2e/screenshots/map-${id}-${width}.png`,
          fullPage: true,
        });
        await page.getByRole("button", { name: "Sheet", exact: true }).click();
      }
    }
    await page.reload();
    await auditReady(page);
    await expect(page.locator(".degree-major")).toContainText(
      "Biomedical Engineering",
    );
  });
}
