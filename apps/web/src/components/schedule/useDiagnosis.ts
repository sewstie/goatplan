"use client";

import { useMemo } from "react";
import { diagnosisText } from "@/lib/diagnosis/diagnosisText";
import { usePlanner } from "@/lib/store";

export function useDiagnosis() {
  const term = usePlanner((state) => state.term);
  const preferences = usePlanner((state) => state.preferences);
  const locks = usePlanner((state) => state.locks);
  const professorByCourse = usePlanner((state) => state.professorByCourse);
  const response = usePlanner((state) => state.response);
  const done = usePlanner((state) => state.solveStatus === "done" && state.termStatus === "ready");
  return useMemo(() => done && response?.ok && response.total === 0 && response.diagnosis && !response.diagnosis.unsure
    ? diagnosisText(response.diagnosis, { term, preferences, locks, professorByCourse })
    : null, [done, response, term, preferences, locks, professorByCourse]);
}
