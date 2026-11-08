import { describe, expect, it } from "vitest";
import { GPS_SECTIONS, gpsCountsForHumanities, isGpsCourse, planGpsCredit } from "./gps";
import { foundCourse, parseCourse, typedCourse } from "./history";

describe("Great Problems Seminar", () => {
  it("knows which sections give a humanities credit", () => {
    expect(GPS_SECTIONS.filter(gpsCountsForHumanities).map((section) => section.id)).toEqual(["climate-present-climate-futures", "recover-reuse-recycle", "biodiversity-conservation"]);
  });

  it("recognizes the two GPS course codes", () => {
    expect(isGpsCourse("FY 1100")).toBe(true);
    expect(isGpsCourse("FY 1101")).toBe(true);
    expect(isGpsCourse("FY 1800")).toBe(false);
  });

  it("adds the two credits a section gives, which the history accepts as they are", () => {
    const { add } = planGpsCredit({ courses: [] }, { sectionId: "recover-reuse-recycle", status: "taken", term: "B Term 2026" });
    expect(add).toEqual([
      { code: "ES 1000", title: "Recover, Reuse, Recycle (GPS)", credits: 3, term: "B Term 2026", status: "taken", apIb: false, source: "found", creditSource: "wpi" },
      { code: "HU 1100", title: "Recover, Reuse, Recycle (GPS)", credits: 3, term: "B Term 2026", status: "taken", apIb: false, source: "found", creditSource: "wpi" },
    ]);
    for (const section of GPS_SECTIONS) {
      for (const course of planGpsCredit({ courses: [] }, { sectionId: section.id, status: "planned" }).add) expect(parseCourse(course)).toEqual(course);
    }
  });

  it("reports codes already in the history and the FY codes the credits replace", () => {
    const history = { courses: [typedCourse("BB 1000"), foundCourse({ code: "FY 1100", title: "The Great Problems Seminars", credits: 3 })] };
    expect(planGpsCredit(history, { sectionId: "climate-present-climate-futures", status: "taken" })).toMatchObject({
      add: [{ code: "INTL 1000" }],
      skipped: ["BB 1000"],
      replace: ["FY 1100"],
    });
  });

  it("does nothing for a section it doesn't know", () => {
    expect(planGpsCredit({ courses: [] }, { sectionId: "nope", status: "taken" })).toEqual({ add: [], skipped: [], replace: [] });
  });
});
