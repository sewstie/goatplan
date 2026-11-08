// The student's course history and its audit. It has its own storage, apart from the planner store and saved plans.

export { SHEET_CLASS_YEAR } from "./requirements";
export { getGapSource, type CourseGaps } from "./courseGaps";
export { useCourseGaps } from "./useCourseGaps";
export { findCourse, loadCatalog, offeringNote, type Catalog } from "./catalog";
export { GPS_COURSES, GPS_SECTIONS, gpsCountsForHumanities, isGpsCourse, planGpsCredit, type GpsCreditPlan, type GpsPick, type GpsSection } from "./gps";
export { applyHuaPath, detectHuaPath, HUA_GROUPINGS, HUA_SUBJECTS, humanitiesCourses, huaPathId, huaProblem, LANGUAGE_PATH_SUBJECTS, parseHuaPath, SEMINAR_CODES, seminarTooEarly, type HuaPath, type HuaPathGuess } from "./humanities";
export { EXAM_PROGRAMS, EXAMS, examAward, examLabel, examScores, findExam, planExamCredit, type Exam, type ExamCourse, type ExamCreditPlan, type ExamPick, type ExamProgram } from "./examCredit";
export {
  cleanCourseCode,
  CREDIT_SOURCES,
  describeBadFile,
  foundCourse,
  isPriorCredit,
  MAX_HISTORY_FILE_LENGTH,
  MAX_TERM_LENGTH,
  parseCredits,
  parseHistoryFile,
  typedCourse,
  type CreditSource,
  type DegreeHistory,
  type FileProblem,
  type HistoryCourse,
  type LinePin,
} from "./history";
export { CREDITS_PER_UNIT, formatUnits, parseUnits, unitLabel } from "./units";
export * from "./terms";
export { DEFAULT_SEMESTER_LOAD, earlierThan, estimatePace, SEMESTER_LOADS, type PaceEstimate } from "./pace";
export { fitsLine, crossListed } from "./rules";
export { applyPins, filledLines, moveOutcome, type MoveOutcome, type PinCourses, type PinnedAudit } from "./pins";
export * from "./sheet";
export * from "./insights";
export { previewImport, type ImportPreview } from "./importPreview";
export { getDegreeSource, type AddResult, type AuditState, type CourseChanges, type DegreeSnapshot, type DegreeSource, type EditResult } from "./degreeSource";
export { useDegree } from "./useDegree";
export * from "./progress";
export { DEPTH_CONFIRMATION, SPORTS_ITEM } from "./requirements";
