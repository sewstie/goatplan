import { expect, type Page } from "@playwright/test";
import type { Course, Day, TermFile } from "../../src/lib/data/types";
import type { SortPresetId } from "../../src/lib/store/types";
import { makeSection } from "../../src/components/sections/testing/sections";
import { termFile } from "../../src/lib/store/testing/fixtures";

/** Each order's name in the Sort menu, as a screen reader announces it. */
export const SORT_LABELS: Record<SortPresetId, string> = {
  bestOverall: "Best overall",
  fewestEarly: "Fewest early classes",
  latestStart: "Latest start",
  earliestFinish: "Earliest finish",
  fewestDays: "Most days off",
  fewestGaps: "Most compact",
};

/** The Sort control at the end of the Preferences row. */
export const sortControl = (page: Page) =>
  page.getByRole("group", { name: "Preferences", exact: true }).getByRole("combobox", { name: "Sort" });
/** Sort's open list. */
export const sortList = (page: Page) => page.getByRole("listbox", { name: "Sort" });
/** One order in the open list, found by its name (the label, without the description). */
export const sortOption = (page: Page, label: string) => sortList(page).getByRole("option", { name: label, exact: true });

/** Opens Sort and picks an order by its name with the pointer. Returns once the list has closed. */
export async function pickSort(page: Page, label: string) {
  await sortControl(page).click();
  await sortOption(page, label).click();
  await expect(sortList(page)).toBeHidden();
}

const MON_WED_THU: Day[] = ["Mon", "Wed", "Thu"];
const MON_TUE_THU_FRI: Day[] = ["Mon", "Tue", "Thu", "Fri"];

const course = (code: string, title: string, lectures: [string, Day[], number][]): Course => ({
  code,
  subject: "DEMO",
  title,
  credits: 1,
  level: "Undergraduate",
  description: "",
  sections: lectures.map(([section, days, start]) =>
    makeSection(`${code}-${section}`, { capacity: 40, enrolled: 10, meetings: [{ days, start, end: start + 50, location: "Example Hall 101" }] }),
  ),
  options: lectures.map(([section]) => [`${code}-${section}`]),
});

/**
 * Three courses with four lectures each: 48 schedules, and each of the six sort orders puts a
 * different one on top, with nothing tied for first. Found by running the real engine with the
 * preset weights, so a change to SORT_PRESETS can move these tops (see sortMenuTops).
 */
export function sortMenuTerm(): TermFile {
  const term = termFile("2027-C");
  term.term = { ...term.term, name: "C Term", season: "Spring", start: "2027-01-13", end: "2027-03-05" };
  term.courses = [
    course("DEMO 3101", "Statics", [["L01", ["Wed"], 840], ["L02", MON_WED_THU, 720], ["L03", ["Wed"], 660], ["L04", ["Tue", "Fri"], 960]]),
    course("DEMO 3102", "Thermodynamics", [["L01", MON_WED_THU, 540], ["L02", ["Wed"], 660], ["L03", MON_WED_THU, 480], ["L04", MON_TUE_THU_FRI, 840]]),
    course("DEMO 3103", "Circuits", [["L01", ["Tue", "Thu"], 540], ["L02", ["Wed"], 540], ["L03", MON_TUE_THU_FRI, 720], ["L04", MON_WED_THU, 960]]),
  ];
  return term;
}

export const SORT_MENU_COURSES = ["DEMO 3101", "DEMO 3102", "DEMO 3103"];

/** Each order's top schedule (DEMO 3101, 3102, 3103 lectures) and the first badge it gets. */
export const sortMenuTops: Record<SortPresetId, { sections: [string, string, string]; firstBadge: string }> = {
  bestOverall: { sections: ["L01", "L02", "L04"], firstBadge: "Tue, Fri off" },
  fewestEarly: { sections: ["L01", "L02", "L03"], firstBadge: "Starts 11 AM" },
  latestStart: { sections: ["L01", "L04", "L04"], firstBadge: "Starts 2 PM" },
  earliestFinish: { sections: ["L02", "L02", "L02"], firstBadge: "Done by 12:50 PM" },
  fewestDays: { sections: ["L01", "L02", "L02"], firstBadge: "4 days off" },
  fewestGaps: { sections: ["L04", "L02", "L02"], firstBadge: "1 h free between classes" },
};
