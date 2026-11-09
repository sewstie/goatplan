import { describe, expect, it } from "vitest";
import { getCourseMap } from "./maps";
import { buildFlowchart, chainOf } from "./flowchart";

describe("engineering background maps", () => {
  it("shares aerospace background without turning the two tracks into different prerequisites", () => {
    const aero = getCourseMap("ae-aero-2030")!;
    const astro = getCourseMap("ae-astro-2030")!;
    expect(aero.records).toBe(astro.records);
    const flow = buildFlowchart(aero.records, aero.layout);
    expect(chainOf(flow, "AE 2110").before).toContain("AE 2330");
    expect(chainOf(flow, "AE 4510").before).toContain("AE 3120");
    expect(chainOf(flow, "AE 4520").before).toContain("AE 4320");
    expect(aero.records.find((course) => course.code === "AE 2210")?.background).toMatchObject({
      all: expect.arrayContaining([{ any: [{ course: "PH 1110" }, { course: "PH 1111" }] }]),
    });
  });

  it("uses published architectural design and biomedical signals chains", () => {
    const aren = getCourseMap("aren-2030")!;
    const bme = getCourseMap("bme-2030")!;
    expect(chainOf(buildFlowchart(aren.records, aren.layout), "AREN 2004").before).toContain("AREN 2002");
    expect(chainOf(buildFlowchart(bme.records, bme.layout), "BME 2211").before).toContain("BME 2210");
    expect(bme.records.find((course) => course.code === "BME 2001")?.background).toHaveProperty("note");
  });

  it("does not infer course maps from actuarial or AI tracking-sheet order", () => {
    expect(getCourseMap("mac-2030")).toBeNull();
    expect(getCourseMap("ai-2030")).toBeNull();
  });

  it("keeps biomedical preparation alternatives and cross-listed history distinct", () => {
    const bme = getCourseMap("bme-2030")!;
    expect(bme.records.find((course) => course.code === "BME 3014")?.background).toEqual({
      any: [{ course: "BME 2211" }, { course: "BME 1004" }],
    });
    expect(bme.records.find((course) => course.code === "BME 3012")?.background).toEqual({
      any: [{ course: "BME 2210" }, { course: "ECE 2010" }, { course: "ECE 2019" }],
    });
    expect(bme.records.find((course) => course.code === "BME 4504")?.aliases).toContain("ME 4504");
    const flow = buildFlowchart(bme.records, bme.layout);
    expect(flow.edges.every((edge) => edge.from !== edge.to)).toBe(true);
  });
});
