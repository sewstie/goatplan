import { expect, it, vi } from "vitest";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { buildRequest } from "./buildRequest";
import { emptyDraft } from "./draft";
import { findProfessorFixes } from "./professorFixes";
import { solved } from "./testing/fixtures";
import { lectureProfessorTerm } from "./testing/lectureProfessors";

const term = lectureProfessorTerm();
const professorByCourse = { "AE 2320": "Ye Lu" };
const request = buildRequest({ ...emptyDraft(), courses: ["AE 2320", "AE 2410"], professorByCourse, term })!;

function answer(request: SolveRequest, total: number): SolveResponse {
  const response = solved(request);
  return response.ok ? { ...response, total, capped: total > 5 } : response;
}

it("tries every other lecture professor alone and keeps the ones that fit, most schedules first", async () => {
  const solve = vi.fn(async (probe: SolveRequest) => {
    const lectures = probe.preferences?.anyOf?.["AE 2320"] ?? [];
    if (lectures.includes("AE 2320-CL03")) return answer(probe, 9);
    return answer(probe, 0);
  });
  const fixes = await findProfessorFixes(request, term, professorByCourse, solve);
  expect(solve.mock.calls.map(([probe]) => probe.preferences?.anyOf)).toEqual([
    { "AE 2320": ["AE 2320-CL02"] },
    { "AE 2320": ["AE 2320-CL03", "AE 2320-CL04"] },
  ]);
  expect(solve.mock.calls.every(([probe]) => probe.limits?.maxSchedules === 1 && probe.courses.length === 2)).toBe(true);
  expect(fixes).toEqual([{ kind: "switchProfessor", course: "AE 2320", professor: "Mark Richman", schedules: 9, capped: true }]);
});

it("skips courses without a chosen professor and stops once the answer is no longer wanted", async () => {
  const solve = vi.fn(async (probe: SolveRequest) => answer(probe, 2));
  expect(await findProfessorFixes(request, term, {}, solve)).toEqual([]);
  expect(solve).not.toHaveBeenCalled();

  let wanted = true;
  solve.mockImplementation(async (probe) => {
    wanted = false;
    return answer(probe, 2);
  });
  const fixes = await findProfessorFixes(request, term, professorByCourse, solve, () => wanted);
  expect(solve).toHaveBeenCalledOnce();
  expect(fixes).toEqual([]);
});
