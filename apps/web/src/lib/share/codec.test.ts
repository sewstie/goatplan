import { describe, expect, it } from "vitest";
import { decodePlan, encodePlan, type SharedPlan } from "./codec";


import { plan } from "./testing";

const raw = (value: unknown) => btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)), (byte) => String.fromCharCode(byte)).join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

describe("share codec", () => {
  it("round trips courses, chosen sections, locks, professors and preferences", () => {
    const encoded = encodePlan(plan);
    expect(encoded).toMatch(/^[\w-]+$/);
    expect(decodePlan(encoded)).toEqual({ ok: true, plan });
  });

  it("only includes plan fields and removes blocked-time names", () => {
    const encoded = encodePlan({ ...plan, degree: { private: true }, preferences: { ...plan.preferences, blocked: [{ day: "Tue", start: 600, end: 660, label: "Private appointment" }] } } as SharedPlan);
    const json = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"));
    expect(json).not.toContain("Private appointment");
    expect(json).not.toContain("degree");
    expect(decodePlan(encoded)).toEqual({ ok: true, plan });
  });

  it("keeps a five-course link below 1,500 characters", () => {
    const courses = ["CS 1101", "MA 1021", "PH 1110", "HU 3900", "WPE 1001"];
    const five: SharedPlan = { ...plan, courses, chosen: {}, locks: {}, professorByCourse: {} };
    for (const code of courses) {
      five.chosen[code] = [`${code}-CL01`, `${code}-CD01`, `${code}-CX01`];
      five.locks[code] = [`${code}-CL01`];
      five.professorByCourse[code] = "A Professor With A Long Name";
    }
    expect(`https://goatplan.vercel.app/#p=${encodePlan(five)}`.length).toBeLessThan(1500);
    expect(decodePlan(encodePlan(five))).toEqual({ ok: true, plan: five });
  });

  it("returns a typed error for old formats and broken data", () => {
    expect(decodePlan(raw({ v: 0 }))).toEqual({ ok: false, reason: "unsupportedVersion" });
    for (const value of ["", "%%%", "a", raw(null), raw([]), raw({ v: 1 }), raw("broken")]) {
      expect(decodePlan(value)).toEqual({ ok: false, reason: "invalidData" });
    }
    expect(decodePlan("a".repeat(16001))).toEqual({ ok: false, reason: "tooLarge" });
  });

  it("rejects hostile values without throwing", () => {
    const valid = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodePlan(plan).replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0))));
    expect(decodePlan(raw(valid))).toEqual({ ok: true, plan });
    const bad = [
      { ...valid, t: "../../secret" }, { ...valid, a: -1 }, { ...valid, a: 1441 },
      { ...valid, b: [["Mon", 660, 600]] }, { ...valid, b: [["Never", 600, 660]] },
      { ...valid, b: [["Mon", 600, 660, "Private"]] }, { ...valid, o: "true" },
      { ...valid, s: "__proto__" }, { ...valid, s: "constructor" }, { ...valid, c: [["__proto__", [], []]] },
      { ...valid, c: [["CS 1101", ["<script>"], []]] },
      { ...valid, c: [["CS 1101", [], [], {}]] }, { ...valid, c: Array(21).fill(valid.c[0]) },
      { ...valid, c: [valid.c[0], valid.c[0]] }, { ...valid, degree: {} },
    ];
    for (const value of bad) expect(decodePlan(raw(value))).toEqual({ ok: false, reason: "invalidData" });
  });
});
