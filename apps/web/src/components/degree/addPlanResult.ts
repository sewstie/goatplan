import type { AddManyResult } from "@/lib/degree/degreeSource";

export type AddPlanTone = "success" | "warning";

export interface AddPlanMessage {
  tone: AddPlanTone;
  title: string;
  detail: string;
}

const courses = (count: number) => `${count} ${count === 1 ? "course" : "courses"}`;

export function addPlanMessage(result: AddManyResult, total: number, term: string): AddPlanMessage {
  if (result.status === "invalid") return { tone: "warning", title: "Couldn’t add these courses", detail: "Check the plan’s term and try again." };
  if (result.status === "unsaved") return { tone: "warning", title: "Added for this visit only", detail: "Your browser isn’t saving data, so they’ll be gone when you leave." };
  if (result.added === 0) return { tone: "success", title: "Already in My degree", detail: total === 1 ? "This course was already there." : `All ${total} courses were already there.` };
  const kept = total - result.added;
  return {
    tone: "success",
    title: `${courses(result.added)} added`,
    detail: kept > 0 ? `Planned for ${term}. ${courses(kept)} already there.` : `Planned for ${term}.`,
  };
}
