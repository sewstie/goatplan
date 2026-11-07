import { describe, expect, it } from "vitest";
import { EXAMS, examAward, examLabel, examScores, findExam, planExamCredit } from "./examCredit";
import { parseCourse, typedCourse } from "./history";

const codes = (id: string, score: number) => examAward(findExam(id)!, score).map((course) => course.code);

describe("exam credit", () => {
  it("follows WPI's score rules for AP and IB", () => {
    expect(codes("ap-calculus-ab", 3)).toEqual([]);
    expect(codes("ap-calculus-ab", 4)).toEqual(["MA 1021"]);
    expect(codes("ap-calculus-ab", 5)).toEqual(["MA 1021", "MA 1022"]);
    expect(codes("ap-calculus-bc", 4)).toEqual(["MA 1021", "MA 1022", "MA 1023"]);
    expect(codes("ib-mathematics-analysis-and-approaches", 5)).toEqual([]);
    expect(codes("ib-mathematics-analysis-and-approaches", 6)).toEqual(["MA 1021", "MA 1022"]);
    expect(codes("ib-chemistry", 6)).toEqual(["CH 1010"]);
    expect(codes("ib-chemistry", 7)).toEqual(["CH 1010", "CH 1020"]);
    expect(codes("ib-computer-science", 7)).toEqual(["CS 1000", "CS 2000"]);
    expect(codes("ib-business-management", 6)).toEqual(["BUS 1000"]);
  });

  it("names exams the way students know them and lists scores high to low", () => {
    expect(examLabel(findExam("ib-computer-science")!)).toBe("IB Computer Science HL");
    expect(examLabel(findExam("ap-statistics")!)).toBe("AP Statistics");
    expect(examScores("AP")).toEqual([5, 4, 3, 2, 1]);
    expect(examScores("IB")).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it("every awarded course is one the history accepts", () => {
    expect(new Set(EXAMS.map((exam) => exam.id)).size).toBe(EXAMS.length);
    for (const exam of EXAMS) {
      const { add } = planExamCredit({ courses: [] }, [{ examId: exam.id, score: 7 }]);
      expect(add.length).toBeGreaterThan(0);
      for (const course of add) expect(parseCourse(course)).toEqual(course);
    }
  });

  it("adds exam courses as taken AP/IB credit, using the catalog title when WPI's table has none", () => {
    const { add } = planExamCredit({ courses: [] }, [{ examId: "ib-computer-science", score: 6 }, { examId: "ap-biology", score: 4 }], (code) => (code === "CS 2000" ? "Computer Science Elective" : undefined));
    expect(add).toEqual([
      { code: "CS 1000", title: "IB Computer Science HL", credits: 3, status: "taken", apIb: true, source: "found", creditSource: "ib" },
      { code: "CS 2000", title: "Computer Science Elective", credits: 3, status: "taken", apIb: true, source: "found", creditSource: "ib" },
      { code: "BB 1000", title: "Biology Elective", credits: 3, status: "taken", apIb: true, source: "found", creditSource: "ap" },
    ]);
  });

  it("never adds a course twice and says which ones were already counted", () => {
    const history = { courses: [typedCourse("MA 1021")] };
    const plan = planExamCredit(history, [{ examId: "ap-calculus-bc", score: 5 }, { examId: "ib-mathematics-analysis-and-approaches", score: 7 }, { examId: "ib-mathematics", score: 7 }]);
    expect(plan.add.map((course) => course.code)).toEqual(["MA 1022", "MA 1023", "MA 1000"]);
    expect(plan.skipped).toEqual([
      { code: "MA 1021", exam: "AP Calculus BC" },
      { code: "MA 1021", exam: "IB Mathematics: Analysis and Approaches HL" },
      { code: "MA 1022", exam: "IB Mathematics: Analysis and Approaches HL" },
      { code: "MA 1000", exam: "IB Mathematics HL" },
    ]);
  });

  it("ignores scores too low for credit and exams it doesn't know", () => {
    expect(planExamCredit({ courses: [] }, [{ examId: "ap-biology", score: 3 }, { examId: "ap-unknown", score: 5 }])).toEqual({ add: [], skipped: [] });
  });
});
