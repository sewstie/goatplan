// The student's course history and its audit. It has its own storage, apart from the planner store and saved plans.

export { SHEET_CLASS_YEAR } from "./requirements";
export { getGapSource, type CourseGaps } from "./courseGaps";
export { useCourseGaps } from "./useCourseGaps";
export { findCourse, loadCatalog, type Catalog } from "./catalog";
export {
  cleanCourseCode,
  CREDIT_SOURCES,
  describeBadFile,
  foundCourse,
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
export { parsePastedCodes, parsePastedCourses, type PastedCourse } from "./paste";
export { CREDITS_PER_UNIT, formatUnits, parseUnits, unitLabel } from "./units";
export * from "./terms";
export { earlierThan, estimatePace, type PaceEstimate } from "./pace";
export { fitsLine, crossListed } from "./rules";
export { applyPins, filledLines, moveOutcome, type MoveOutcome, type PinCourses, type PinnedAudit } from "./pins";
export * from "./sheet";
export * from "./insights";
export { previewImport, type ImportPreview } from "./importPreview";
export { getDegreeSource, type AddResult, type AuditState, type CourseChanges, type DegreeSnapshot, type DegreeSource, type EditResult } from "./degreeSource";
export { useDegree } from "./useDegree";
export * from "./progress";
export { DEPTH_CONFIRMATION, SPORTS_ITEM } from "./requirements";
