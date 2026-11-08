import type { Locator } from "@playwright/test";
import { formatTime } from "../../src/lib/data/time";

export async function chooseOption(scope: Locator, field: string, option: string) {
  await scope.getByRole("combobox", { name: field, exact: true }).click();
  await scope.page().getByRole("option", { name: option, exact: true }).click();
}

export const chooseTime = (scope: Locator, field: string, minutes: number) => chooseOption(scope, field, formatTime(minutes));

export async function pickTerm(scope: Locator, field: string, term: string) {
  await scope.getByRole("button", { name: new RegExp(`^${field} `) }).click();
  await scope.page().getByRole("grid", { name: "Terms by school year" }).getByRole("button", { name: new RegExp(`^${term}`) }).click();
}
