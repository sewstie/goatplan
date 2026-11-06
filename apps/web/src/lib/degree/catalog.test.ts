import { describe, expect, it, vi } from "vitest";
import { findCourse, loadCatalog } from "./catalog";

const records = [
  { code: "CS 2102", title: "Object-Oriented Design Concepts", credits: 3, level: "Undergraduate", offeredThisYear: true, termLetters: ["B", "C"] },
  { code: "AB 2533", title: "Intermediate Arabic III", credits: 3, level: "Undergraduate", offeredThisYear: false, termLetters: [] },
];

describe("degree catalog", () => {
  it("loads courses without depending on published term files, including unoffered courses", async () => {
    const read = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ courses: records }));
    const catalog = await loadCatalog(read);
    expect(read).toHaveBeenCalledExactlyOnceWith("/data/catalog.json");
    expect(catalog.complete).toBe(true);
    expect(findCourse(catalog.courses, "AB 2533")).toMatchObject({ title: "Intermediate Arabic III", credits: 3, offeredThisYear: false });
    expect(findCourse(catalog.courses, "CS 21")).toBeUndefined();
  });

  it("reports a failed catalog load so it can be retried", async () => {
    const read = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 503 }));
    expect(await loadCatalog(read)).toEqual({ complete: false, courses: [] });
  });
});
