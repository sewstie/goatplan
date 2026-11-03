import { WEEK } from "@/lib/data/days";
import type { Day } from "@/lib/data/types";
import { isTermId } from "@/lib/data/load";
import { isSortPresetId, SORT_PRESETS } from "@/lib/store/sortPresets";
import type { OpenedPlan } from "@/lib/store/types";

export type SharedPlan = OpenedPlan & { termId: string; chosen: Record<string, string[]> };
export type DecodeResult = { ok: true; plan: SharedPlan } | { ok: false; reason: "unsupportedVersion" | "invalidData" | "tooLarge" };

export function encodePlan(plan: SharedPlan): string {
  const data = {
    v: 1,
    t: plan.termId,
    c: plan.courses.map((code) => {
      const row: unknown[] = [code, plan.chosen[code] ?? [], plan.locks[code] ?? []];
      if (Object.hasOwn(plan.professorByCourse, code)) row.push(plan.professorByCourse[code]);
      return row;
    }),
    a: plan.preferences.startsAfter,
    b: plan.preferences.blocked.map(({ day, start, end }) => [day, start, end]),
    o: plan.preferences.onlyOpen,
    s: plan.sortPreset,
  };
  return btoa(Array.from(new TextEncoder().encode(JSON.stringify(data)), (byte) => String.fromCharCode(byte)).join(""))
    .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

const minute = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 1440;
const ids = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 16 && new Set(value).size === value.length && value.every((id) => typeof id === "string" && /^[A-Za-z0-9 _./-]{1,100}$/.test(id));

export function decodePlan(encoded: string): DecodeResult {
  try {
    if (typeof encoded !== "string") return { ok: false, reason: "invalidData" };
    if (encoded.length > 16000) return { ok: false, reason: "tooLarge" };
    if (!/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length % 4 === 1) return { ok: false, reason: "invalidData" };
    const bytes = Uint8Array.from(atob(encoded.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, reason: "invalidData" };
    if (typeof value.v === "number" && value.v !== 1) return { ok: false, reason: "unsupportedVersion" };
    const { v, t, c, a, b, o, s } = value;
    if (v !== 1 || Object.keys(value).sort().join() !== "a,b,c,o,s,t,v" || typeof t !== "string" || !isTermId(t) || !isSortPresetId(s) || !Object.hasOwn(SORT_PRESETS, s) || !minute(a) || typeof o !== "boolean") return { ok: false, reason: "invalidData" };
    if (!Array.isArray(c) || c.length === 0 || c.length > 20 || !Array.isArray(b) || b.length > 64) return { ok: false, reason: "invalidData" };
    const plan: SharedPlan = { termId: t, courses: [], chosen: {}, locks: {}, professorByCourse: {}, preferences: { startsAfter: a, blocked: [], onlyOpen: o }, sortPreset: s };
    for (const row of c) {
      if (!Array.isArray(row) || row.length < 3 || row.length > 4) return { ok: false, reason: "invalidData" };
      const [code, chosen, locks, professor] = row;
      if (typeof code !== "string" || !/^[A-Z]{2,5} \d{3,4}[A-Z]?$/.test(code) || plan.courses.includes(code) || !ids(chosen) || !ids(locks)) return { ok: false, reason: "invalidData" };
      if (row.length === 4 && professor !== null && (typeof professor !== "string" || professor.trim().length === 0 || professor.length > 160 || /[\u0000-\u001f\u007f]/.test(professor))) return { ok: false, reason: "invalidData" };
      plan.courses.push(code);
      plan.chosen[code] = chosen;
      if (locks.length) plan.locks[code] = locks;
      if (row.length === 4) plan.professorByCourse[code] = professor;
    }
    for (const block of b) {
      if (!Array.isArray(block) || block.length !== 3 || !WEEK.includes(block[0] as Day) || !minute(block[1]) || !minute(block[2]) || block[1] >= block[2]) return { ok: false, reason: "invalidData" };
      plan.preferences.blocked.push({ day: block[0], start: block[1], end: block[2] });
    }
    return { ok: true, plan };
  } catch {
    return { ok: false, reason: "invalidData" };
  }
}
