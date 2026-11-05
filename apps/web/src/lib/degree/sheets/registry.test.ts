import { describe, expect, it } from "vitest";
import { loadSheet, SHEETS } from "./index";

describe("tracking sheets", () => {
  it("loads CS with its official sources and an unverified beta record", async () => {
    const sheet = await loadSheet("cs-2030");
    expect(sheet).toMatchObject({ id: "cs-2030", major: "Computer Science", classYear: 2030, totalUnits: 15 });
    expect(SHEETS).toEqual([expect.objectContaining({
      id: "cs-2030",
      major: "Computer Science",
      classYear: 2030,
      source: "https://www.wpi.edu/sites/default/files/2026-06/CS-2030_fillable.pdf",
      catalogSource: "https://wpi.cleancatalog.net/computer-science/computer-science-major",
      status: "beta",
      verification: null,
    })]);
  });
});
