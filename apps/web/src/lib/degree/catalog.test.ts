import { describe, expect, it, vi } from "vitest";
import { findCourse, loadCatalog, offeringNote } from "./catalog";

const records = [
  { code: "CS 2102", title: "Object-Oriented Design Concepts", credits: 3, level: "Undergraduate", lastOffered: "2027-C", termLetters: ["B", "C"] },
  { code: "AB 2533", title: "Intermediate Arabic III", credits: 3, level: "Undergraduate", lastOffered: null, termLetters: [] },
];

describe("degree catalog", () => {
  it("loads courses without depending on published term files, including unoffered courses", async () => {
    const read = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ courses: records }));
    const catalog = await loadCatalog(read);
    expect(read).toHaveBeenCalledExactlyOnceWith("/data/catalog.json");
    expect(catalog.complete).toBe(true);
    expect(findCourse(catalog.courses, "AB 2533")).toMatchObject({ title: "Intermediate Arabic III", credits: 3, lastOffered: null });
    expect(findCourse(catalog.courses, "CS 21")).toBeUndefined();
  });

  it("reports a failed catalog load so it can be retried", async () => {
    const read = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 503 }));
    expect(await loadCatalog(read)).toEqual({ complete: false, courses: [] });
  });

  it("says when a course isn't offered this academic year, based on today's date", () => {
    const fall2026 = new Date(2026, 10, 6);
    expect(offeringNote({ lastOffered: "2027-C" }, fall2026)).toBeNull();
    expect(offeringNote({ lastOffered: "2026-A" }, fall2026)).toBeNull();
    expect(offeringNote({ lastOffered: "2026-E" }, fall2026)).toBe("Last offered in E Term 2026");
    expect(offeringNote({ lastOffered: null }, fall2026)).toBe("Not offered in 2026–27");
    expect(offeringNote({ lastOffered: "2027-D" }, new Date(2027, 7, 20))).toBe("Last offered in D Term 2027");
    expect(offeringNote({ lastOffered: null }, new Date(2027, 7, 20))).toBe("Not offered in 2027–28");
    expect(offeringNote({ lastOffered: "2027-E" }, new Date(2027, 6, 1))).toBeNull();
  });
});
