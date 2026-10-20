// WPI's flat rows → sections → courses → one object per term.

import { buildOptions, groupBy } from "./group-clusters.mjs";
import {
  cleanDescription,
  normalizeDelivery,
  normalizeStatus,
  normalizeType,
  parseCourseSection,
  parseCourseTitle,
  parseCredits,
  parseFraction,
  parseInstructors,
  parseLevel,
  parseTerm,
} from "./parse-fields.mjs";
import { DAYS, mergeMeetings, parseMeetings } from "./parse-meetings.mjs";

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "");
const slug = (s) => (s ?? "").trim().toLowerCase().replace(/\s+/g, "-") || "unknown";

// Same text apart from case, spacing and punctuation.
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const sameText = (a, b) => squash(a) === squash(b);

// ISO dates compare fine as plain strings.
const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

// Collects every value the parsers couldn't read, for the summary.
export function collectUnparsed() {
  const seen = new Map();
  return {
    add(field, value, where) {
      const key = `${field}\n${value}`;
      if (!seen.has(key)) seen.set(key, { field, value, count: 0, examples: [] });
      const entry = seen.get(key);
      entry.count += 1;
      if (where && entry.examples.length < 3) entry.examples.push(where);
    },
    entries() {
      return [...seen.values()].sort(
        (a, b) => compare(a.field, b.field) || b.count - a.count || compare(a.value, b.value),
      );
    },
  };
}

export function skipReason(row) {
  const course = parseCourseTitle(row.Course_Title);
  const section = parseCourseSection(row.Course_Section);
  if (!course || !section) return "unreadable";
  return section.placeholder;
}

export function buildSection(row, { onUnparsed } = {}) {
  const course = parseCourseTitle(row.Course_Title);
  const parsed = parseCourseSection(row.Course_Section);
  if (!course || !parsed) return null;

  const id = `${course.code}-${parsed.code}`;
  const note = (field, value) => onUnparsed?.(field, value ?? "", id);

  const seats = parseFraction(row.Enrolled_Capacity);
  if (!seats) note("Enrolled_Capacity", row.Enrolled_Capacity);
  const waitlist = parseFraction(row.Waitlist_Waitlist_Capacity);
  if (!waitlist) note("Waitlist_Waitlist_Capacity", row.Waitlist_Waitlist_Capacity);

  const status = normalizeStatus(row.Section_Status);
  if (!status) note("Section_Status", row.Section_Status);
  const delivery = normalizeDelivery(row.Delivery_Mode, row.Locations);
  if (!delivery) note("Delivery_Mode", row.Delivery_Mode);

  const hasDates = isDate(row.Course_Section_Start_Date) && isDate(row.Course_Section_End_Date);

  return {
    id,
    code: parsed.code,
    type: normalizeType(row.Instructional_Format),
    status: status ?? slug(row.Section_Status),
    enrolled: seats?.taken ?? 0,
    capacity: seats?.capacity ?? 0,
    waitlist: waitlist ?? { taken: 0, capacity: 0 },
    instructors: parseInstructors(row.Instructors),
    delivery: delivery ?? slug(row.Delivery_Mode),
    meetings: parseMeetings(row.Meeting_Patterns, row.Locations, {
      details: row.Section_Details,
      onUnparsed: (pattern) => note("Meeting_Patterns", pattern),
    }),

    // buildCourse uses these, then drops them or keeps only what differs from the course.
    course: course.code,
    period: row.Offering_Period ?? "",
    cluster: row.CF_LRV_Cluster_Ref_ID || null,
    title: parsed.title,
    courseTitle: course.title,
    description: cleanDescription(row.Course_Description),
    credits: parseCredits(row.Credits),
    level: parseLevel(row.Academic_Level, course.code),
    dates: hasDates
      ? { start: row.Course_Section_Start_Date, end: row.Course_Section_End_Date }
      : null,
  };
}

// Ties go to whatever prefer() ranks first, otherwise to the first one seen.
function mostCommon(values, { key = (v) => v, prefer = () => 0 } = {}) {
  const tally = new Map();
  for (const value of values) {
    const k = key(value);
    if (!tally.has(k)) tally.set(k, { value, count: 0 });
    tally.get(k).count += 1;
  }
  const ranked = [...tally.values()].sort((a, b) => b.count - a.count || prefer(a.value, b.value));
  return ranked[0]?.value ?? null;
}

// A semester-long section can list a different room for each term. Keep this term's.
function meetingsInTerm(meetings, term) {
  const inTerm = meetings.filter(
    (m) => !m.dates || !term?.start || !term?.end || overlaps(m.dates, term),
  );
  return mergeMeetings(inTerm.map(({ dates, ...meeting }) => meeting));
}

export function buildCourse(rows, { term = null, onUnparsed, onDroppedOptions } = {}) {
  const built = rows
    .map((row) => buildSection(row, { onUnparsed }))
    .filter(Boolean)
    .map((section) => ({ ...section, meetings: meetingsInTerm(section.meetings, term) }))
    .sort((a, b) => compare(a.id, b.id));

  const sections = [];
  for (const section of built) {
    if (sections.at(-1)?.id === section.id) {
      onUnparsed?.("Course_Section", "listed more than once", section.id);
    } else {
      sections.push(section);
    }
  }
  if (sections.length === 0) return null;

  const [first] = sections;
  const title = first.courseTitle;
  const credits = mostCommon(
    sections.map((s) => s.credits).filter((c) => c !== null),
    { prefer: (a, b) => b - a },
  );
  const description =
    mostCommon(
      sections.map((s) => s.description).filter(Boolean),
      { key: squash },
    ) ?? "";

  // A semester-long lecture never pairs with a one-term lab.
  let droppedOptions = 0;
  const options = [...groupBy(sections, (s) => s.period).values()]
    .flatMap((group) => buildOptions(group, { onDrop: () => droppedOptions++ }))
    .sort((a, b) => compare(a.join("\n"), b.join("\n")));
  if (droppedOptions > 0) onDroppedOptions?.(first.course, droppedOptions);

  return {
    code: first.course,
    subject: first.course.split(" ")[0],
    title,
    credits,
    level: first.level,
    description,
    sections: sections.map((s) => {
      const ownDates = s.dates && (s.dates.start !== term?.start || s.dates.end !== term?.end);
      return {
        id: s.id,
        code: s.code,
        type: s.type,
        ...(s.title && !sameText(s.title, title) ? { title: s.title } : {}),
        status: s.status,
        enrolled: s.enrolled,
        capacity: s.capacity,
        waitlist: s.waitlist,
        instructors: s.instructors,
        delivery: s.delivery,
        ...(s.credits !== null && s.credits !== credits ? { credits: s.credits } : {}),
        ...(ownDates ? { dates: s.dates } : {}),
        meetings: s.meetings,
        ...(s.description && !sameText(s.description, description)
          ? { description: s.description }
          : {}),
      };
    }),
    options,
  };
}

// The dates most of a term's sections share.
function termDates(rows) {
  const dated = rows.filter(
    (r) => isDate(r.Course_Section_Start_Date) && isDate(r.Course_Section_End_Date),
  );
  const most = mostCommon(
    dated.map((r) => `${r.Course_Section_Start_Date}|${r.Course_Section_End_Date}`),
    { prefer: compare },
  );
  const [start = null, end = null] = most?.split("|") ?? [];
  return { start, end };
}

// Semester-long and late-start sections go into every lettered term they overlap.
export function buildTerms(rows, { onUnparsed } = {}) {
  const skipped = {};
  const real = [];
  for (const row of rows) {
    const reason = skipReason(row);
    if (reason) skipped[reason] = (skipped[reason] ?? 0) + 1;
    else real.push(row);
  }

  const lettered = [];
  const spanning = [];
  for (const [period, periodRows] of groupBy(real, (r) => r.Offering_Period ?? "")) {
    const term = parseTerm(period);
    if (term) lettered.push({ term: { ...term, ...termDates(periodRows) }, rows: periodRows });
    else spanning.push({ period, rows: periodRows });
  }
  lettered.sort(
    (a, b) => compare(a.term.start ?? "", b.term.start ?? "") || compare(a.term.id, b.term.id),
  );

  const report = { skipped, placed: [], unplaced: [], droppedOptions: [] };
  for (const { period, rows: periodRows } of spanning) {
    const into = new Set();
    let unplaced = 0;
    for (const row of periodRows) {
      const dates = { start: row.Course_Section_Start_Date, end: row.Course_Section_End_Date };
      const homes = lettered.filter(
        ({ term }) =>
          isDate(dates.start) && isDate(dates.end) && term.start && overlaps(dates, term),
      );
      for (const home of homes) {
        home.rows.push(row);
        into.add(home.term.id);
      }
      if (homes.length === 0) unplaced += 1;
    }
    if (into.size > 0) {
      report.placed.push({ period, rows: periodRows.length - unplaced, into: [...into] });
    }
    if (unplaced > 0) report.unplaced.push({ period, rows: unplaced });
  }

  const terms = lettered.map(({ term, rows: termRows }) => ({
    term,
    courses: [...groupBy(termRows, (r) => parseCourseTitle(r.Course_Title).code).values()]
      .map((courseRows) =>
        buildCourse(courseRows, {
          term,
          onUnparsed,
          onDroppedOptions: (course, count) =>
            report.droppedOptions.push({ term: term.id, course, count }),
        }),
      )
      .filter(Boolean)
      .sort((a, b) => compare(a.code, b.code)),
  }));

  return { terms, report };
}

// Sections in no option: WPI doesn't say what to take them with.
export function unscheduledSections({ courses }) {
  return courses.flatMap((course) => {
    const used = new Set(course.options.flat());
    return course.sections.filter((s) => !used.has(s.id)).map((s) => s.id);
  });
}

const isCount = (n) => Number.isInteger(n) && n >= 0;

export function validateTerm({ term, courses }, warn = console.warn) {
  let problems = 0;
  const problem = (where, message) => {
    problems += 1;
    warn(`  ! ${term.id} ${where}: ${message}`);
  };

  // Without dates there's no telling whether the term has ended.
  if (!isDate(term.start) || !isDate(term.end) || term.start > term.end) {
    problem("term", `dates are ${term.start} to ${term.end}`);
  }

  const seen = new Set();
  for (const course of courses) {
    if (course.credits !== null && !Number.isFinite(course.credits)) {
      problem(course.code, `credits is ${course.credits}`);
    }

    const ids = new Set();
    for (const section of course.sections) {
      if (seen.has(section.id)) problem(section.id, "section id is used twice");
      seen.add(section.id);
      ids.add(section.id);

      const counts = {
        enrolled: section.enrolled,
        capacity: section.capacity,
        "waitlist.taken": section.waitlist?.taken,
        "waitlist.capacity": section.waitlist?.capacity,
      };
      for (const [name, value] of Object.entries(counts)) {
        if (!isCount(value)) problem(section.id, `${name} is ${value}`);
      }

      for (const meeting of section.meetings) {
        const { days, start, end } = meeting;
        if (!isCount(start) || !isCount(end) || end > 24 * 60) {
          problem(section.id, `meeting time ${start}-${end} is not minutes of a day`);
        } else if (start >= end) {
          problem(section.id, `meeting starts at ${start} but ends at ${end}`);
        }
        if (!Array.isArray(days) || days.length === 0 || days.some((d) => !DAYS.includes(d))) {
          problem(section.id, `meeting days are ${JSON.stringify(days)}`);
        }
      }
    }

    if (course.options.length === 0) problem(course.code, "course has no options");
    for (const option of course.options) {
      if (option.length === 0) problem(course.code, "empty option");
      for (const id of option) {
        if (!ids.has(id)) problem(course.code, `option points to missing section ${id}`);
      }
    }
  }
  return problems;
}
