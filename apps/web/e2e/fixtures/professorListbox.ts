import { coursePanelTerm } from "./coursePanel";
import { makeSection } from "../../src/components/sections/testing/sections";

export function professorListboxTerm() {
  const term = coursePanelTerm("24");
  const course = term.courses[0];
  const lectures = [
    { code: "L01", start: 480, instructors: ["Alex Rivera"] },
    { code: "L02", start: 600, instructors: ["Alex Rivera"] },
    { code: "L03", start: 780, instructors: ["Alex Rivera", "Jordan Kim"] },
    { code: "L04", start: 660, instructors: ["Morgan Lee"] },
  ].map(({ code, start, instructors }) => makeSection(`DEMO 1001-${code}`, {
    capacity: 40, enrolled: 22, instructors,
    meetings: [{ days: code === "L03" ? ["Mon", "Wed"] : ["Tue", "Thu"], start, end: start + 50, location: "Example Hall 101" }],
  }));
  course.sections = [...lectures, ...course.sections.filter((section) => section.code === "B01" || section.code === "D01")];
  course.options = lectures.map((section) => [section.id, "DEMO 1001-B01", "DEMO 1001-D01"]);
  term.instructors!["Jordan Kim"] = { rating: { score: 4.1, count: 15 }, ratingSource: "Example data" };
  return term;
}
