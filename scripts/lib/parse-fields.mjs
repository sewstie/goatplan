// Parsers for the single-value fields of one WPI row: term, course title,
// section code, seat counts, instructors, and the small set of categories.
//
// Like parse-meetings.mjs these are pure functions that return null for text
// they can't read, so the caller decides what to do about it.

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

// "2027 Spring C Term" → { id: "2027-C", name: "C Term", season: "Spring", year: 2027 }
//
// Only the lettered terms get an id. Longer periods ("2026 Fall Semester",
// "2027 Spring Late Start Online") return null: their sections are placed into
// the lettered terms they overlap, see buildTerms.
export function parseTerm(s) {
  const match = /^(\d{4}) (\w+) (\w+) Term$/.exec(clean(s));
  if (!match) return null;
  const [, year, season, letter] = match;
  return { id: `${year}-${letter}`, name: `${letter} Term`, season, year: Number(year) };
}

// "AE 2320 - Introduction to Orbital Mechanics"
//   → { code: "AE 2320", subject: "AE", title: "Introduction to Orbital Mechanics" }
// Only the first " - " splits, so "WPE 1204 - Club Sport - Dance Team" keeps its full title.
export function parseCourseTitle(s) {
  const match = /^([A-Z]+) ([A-Z0-9]+) - (.+)$/.exec(clean(s));
  if (!match) return null;
  const [, subject, number, title] = match;
  return { code: `${subject} ${number}`, subject, title };
}

// WPI lists two kinds of rows that are not real sections: sign-up lists for
// when a course is full, and cancelled sections renamed "X cancel <date>".
const PLACEHOLDERS = [
  ["interest-list", /^[A-Z0-9]*\s*-\s*Interest List\b/i],
  ["cancelled", /^X\s+cancel/i],
];

// Splits WPI's Course_Section text into its parts.
//
//   "MA 1021-AD02 (group 2) - Calculus I"
//   → { course: "MA 1021", code: "AD02", title: "Calculus I", placeholder: null }
//
// The code keeps any suffix that tells sections apart ("BX03-A",
// "BS01-Multipurpose") but drops the "(group N)" note, which WPI puts on either
// side of the dash and which the cluster ID already expresses.
export function parseCourseSection(s) {
  const match = /^([A-Z]+ [A-Z0-9]+)-(.+)$/.exec(clean(s));
  if (!match) return null;
  const [, course, rest] = match;

  const placeholder = PLACEHOLDERS.find(([, pattern]) => pattern.test(rest))?.[0] ?? null;
  const dash = rest.indexOf(" - ");
  const withoutGroup = (text) => clean(text.replace(/\(group \d+\)/gi, ""));
  const code = withoutGroup(dash < 0 ? rest : rest.slice(0, dash));
  if (code === "") return null;

  return { course, code, title: dash < 0 ? "" : withoutGroup(rest.slice(dash + 3)), placeholder };
}

// "AE 2320-CX01 - Introduction to Orbital Mechanics" → "CX01"
export function parseSectionCode(s) {
  return parseCourseSection(s)?.code ?? null;
}

// "85/120" → { taken: 85, capacity: 120 }. Over-enrolled values such as "21/20" are kept as they are.
export function parseFraction(s) {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(clean(s));
  if (!match) return null;
  return { taken: Number(match[1]), capacity: Number(match[2]) };
}

// "Shichao Liu; Nan Ma" → ["Shichao Liu", "Nan Ma"]. Empty → [].
export function parseInstructors(s) {
  return [...new Set((s ?? "").split(";").map(clean).filter(Boolean))];
}

// "3" → 3, "0.75" → 0.75. Empty or unreadable → null.
export function parseCredits(s) {
  const text = clean(s);
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

// WPI's Academic_Level when present, otherwise the course number decides:
// graduate courses are numbered 500-999 or 5000 and up.
export function parseLevel(s, courseCode = "") {
  const text = clean(s);
  if (text) return text;
  const number = Number.parseInt(courseCode.split(" ")[1] ?? "", 10);
  if (Number.isNaN(number)) return null;
  return (number >= 500 && number < 1000) || number >= 5000 ? "Graduate" : "Undergraduate";
}

const TYPES = new Map([
  ["lecture", "lecture"],
  ["laboratory", "lab"],
  ["lab", "lab"],
  // WPI's catalog says "conference"; the listing calls the same thing "Discussion".
  ["discussion", "discussion"],
  ["conference", "discussion"],
  ["seminar", "seminar"],
  ["workshop", "workshop"],
]);

// "Lecture" → "lecture", "Laboratory" → "lab", "Discussion" → "discussion",
// "Seminar" → "seminar", "Workshop" → "workshop", anything else → "other".
export function normalizeType(s) {
  return TYPES.get(clean(s).toLowerCase()) ?? "other";
}

// "Open" / "Closed" / "Waitlist" → "open" / "closed" / "waitlist". Anything else → null.
export function normalizeStatus(s) {
  const status = clean(s).toLowerCase();
  return ["open", "closed", "waitlist"].includes(status) ? status : null;
}

// "In-Person" → "in-person", "Hybrid" → "hybrid", "Online" → "online".
// An online section whose location says how it meets becomes "online-sync" or
// "online-async", so that survives even when the section has no meeting time.
export function normalizeDelivery(s, locations = "") {
  const mode = clean(s).toLowerCase();
  if (mode === "in-person" || mode === "hybrid") return mode;
  if (mode !== "online") return null;
  if (/asynchronous/i.test(locations)) return "online-async";
  if (/synchronous/i.test(locations)) return "online-sync";
  return "online";
}

const BLOCK_TAGS = /<\/?(p|br|div|li|ul|ol|h[1-6]|tr|td|th|table|blockquote)\b[^>]*>/gi;
const ENTITIES = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
  ["nbsp", " "],
]);

function decodeEntity(entity, body) {
  if (body[0] !== "#") return ENTITIES.get(body.toLowerCase()) ?? entity;
  const hex = body[1] === "x" || body[1] === "X";
  const codePoint = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
  return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
}

// "<p>Cat. I<br />Topics &amp; methods&nbsp;...</p>" → "Cat. I Topics & methods ..."
// Strips tags, decodes entities and collapses whitespace into single spaces.
export function cleanDescription(html) {
  const text = clean(
    (html ?? "")
      // Block tags separate words; inline ones (<span>, <i>) can sit inside a word.
      .replace(BLOCK_TAGS, " ")
      .replace(/<\/?[a-zA-Z][^>]*>/g, "")
      .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity),
  );
  // WPI often glues the catalog category to the first word: "Cat. IThis course".
  // An "I" only starts that word when a lowercase letter follows ("Cat. IIn this"),
  // which leaves a category that is already separate ("Cat. II GOV 1320") alone.
  return text.replace(/^Cat\. (III|II|I)(?=[A-HJ-Z]|I[a-z])/, "Cat. $1 ");
}
