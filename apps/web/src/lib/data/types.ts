// Shapes of the files in /data, as described in docs/data-format.md.

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type SectionType = "lecture" | "lab" | "discussion" | "seminar" | "workshop" | "other";

export type SectionStatus = "open" | "closed" | "waitlist";

export type Delivery = "in-person" | "hybrid" | "online" | "online-sync" | "online-async";

export type Level = "Undergraduate" | "Graduate";

export interface DateRange {
  start: string;
  end: string;
}

export interface Meeting {
  days: Day[];
  /** Minutes after midnight. */
  start: number;
  /** Minutes after midnight. */
  end: number;
  location: string;
}

export interface Waitlist {
  taken: number;
  capacity: number;
}

export interface Section {
  id: string;
  code: string;
  type: SectionType;
  status: SectionStatus;
  enrolled: number;
  capacity: number;
  waitlist: Waitlist;
  instructors: string[];
  delivery: Delivery;
  meetings: Meeting[];
  /** Only when it differs from the course. */
  title?: string;
  /** Only when it differs from the course. */
  description?: string;
  /** Only when it differs from the course. */
  credits?: number | null;
  /** Only when it differs from the term. */
  dates?: DateRange;
}

export interface Course {
  code: string;
  subject: string;
  title: string;
  credits: number | null;
  level: Level;
  description: string;
  sections: Section[];
  /** Every valid way to take the course, as lists of section ids. */
  options: string[][];
}

export interface Term {
  id: string;
  name: string;
  season: string;
  year: number;
  start: string;
  end: string;
}

export interface TermFile {
  term: Term;
  generatedAt: string;
  courses: Course[];
  instructors?: Record<string, Instructor>;
}

export interface InstructorRating {
  score: number;
  count: number;
}

export interface Instructor {
  rating?: InstructorRating | null;
  ratingSource?: string;
}

export type TermStatus = "upcoming" | "in-progress";

export interface TermSummary extends Term {
  status: TermStatus;
  courses: number;
  sections: number;
  generatedAt: string;
}

export interface TermIndex {
  terms: TermSummary[];
}
