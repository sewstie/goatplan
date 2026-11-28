import { expect, test } from "./fixtures/test";
import { auditReady } from "./fixtures/degree";

const majors = [
  ["bbt-2030", "Biology and Biotechnology"],
  ["bc-2030", "Biochemistry"],
  ["ch-2030", "Chemistry"],
  ["bcb-2030", "Bioinformatics and Computational Biology"],
  ["eve-2030", "Environmental Engineering"],
  ["baaai-2030", "Business Analytics and Applied AI"],
  ["mkt-2030", "Marketing Analytics"],
  ["pw-2030", "Professional Writing"],
];

for (const width of [1440, 834]) {
  test(`new sheets select, audit and persist at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => {
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
    });
    await page.goto("/degree");
    await expect(
      page.getByRole("heading", { name: "Choose your major" }),
    ).toBeVisible();
    await page
      .getByRole("radio", { name: "Biology and Biotechnology", exact: true })
      .focus();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("radio", {
        name: "Biology and Biotechnology",
        exact: true,
      }),
    ).toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("radio", { name: "Biochemistry", exact: true }),
    ).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(
      page.getByRole("radio", {
        name: "Biology and Biotechnology",
        exact: true,
      }),
    ).toBeChecked();
    await page.screenshot({
      path: `e2e/screenshots/degree-expanded-picker-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    for (const [index, [id, major]] of majors.entries()) {
      if (index > 0)
        await page.getByRole("button", { name: "Change major" }).click();
      await page.getByRole("radio", { name: major, exact: true }).check();
      await page.getByRole("button", { name: "Open my sheet" }).click();
      await auditReady(page);
      await expect(page.locator(".degree-major")).toContainText(major);
      await expect(
        page.getByRole("button", { name: "Course map", exact: true }),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("goatplan:history:v1") ?? "{}")
                .sheetId,
          ),
        )
        .toBe(id);
      if (id === "pw-2030")
        await expect(
          page.getByText("42a · 1/12 unit", { exact: true }),
        ).toBeVisible();
      await page.screenshot({
        path: `e2e/screenshots/degree-${id}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.reload();
    await auditReady(page);
    await expect(page.locator(".degree-major")).toContainText(
      "Professional Writing",
    );
    await page.getByRole("button", { name: "Change major" }).click();
    await page
      .getByRole("radio", {
        name: "Chemical Engineering Coming soon",
        exact: true,
      })
      .check();
    await expect(
      page.getByRole("button", { name: "Request this major" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open my sheet" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Change major" }),
    ).toBeFocused();
  });
}
