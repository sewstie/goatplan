import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "./fixtures/test";
import { DEGREE_FLAG_KEY, HISTORY_KEY, fixtureHistory, panel } from "./fixtures/degree";

for (const width of [1440, 375]) {
  test(`saved history stays usable when the sheet download fails at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const directory = path.resolve(".next/static/chunks");
    const chunks = readdirSync(directory).filter((name) => name.endsWith(".js") && readFileSync(path.join(directory, name), "utf8").includes("cs-systems-programming"));
    expect(chunks).toHaveLength(1);
    await page.route("**/_next/static/chunks/*.js", (route) => chunks.some((name) => route.request().url().endsWith(`/${name}`)) ? route.abort() : route.continue());
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(({ flag, key, history }) => {
      localStorage.setItem(flag, "on");
      localStorage.setItem(key, JSON.stringify({ version: 1, ...history }));
      localStorage.setItem("goatplan:tutorial:v1", "dismissed");
      localStorage.setItem("goatplan:term:v1", "2027-C");
    }, { flag: DEGREE_FLAG_KEY, key: HISTORY_KEY, history: fixtureHistory("degree-history-mid.json") });
    await page.goto("/degree");
    await expect(page.getByText("We couldn’t check your progress. Your courses are still saved.")).toBeVisible();
    await page.getByRole("button", { name: "Sheet options" }).click();
    if (width === 375) await expect(page.getByRole("button", { name: "Your confirmations", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Course history", exact: true }).click();
    await expect(panel(page, "Course history").getByRole("button", { name: "CS 2102 details" })).toBeVisible();
    await page.getByRole("button", { name: "CS 2102 details" }).click();
    await expect(page.getByRole("textbox", { name: "Course code" })).toHaveValue("CS 2102");
    await expect(page.getByRole("button", { name: "Move to line…" })).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
