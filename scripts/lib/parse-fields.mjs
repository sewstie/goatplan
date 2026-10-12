// Parsers for the single-value fields of a WPI row. They return null for text they can't read.

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

// Only lettered terms get an id. "2026 Fall Semester" returns null, and
// buildTerms places those sections by date.
export function parseTerm(s) {
  const match = /^(\d{4}) (\w+) (\w+) Term$/.exec(clean(s));
  if (!match) return null;
  const [, year, season, letter] = match;
  return { id: `${year}-${letter}`, name: `${letter} Term`, season, year: Number(year) };
}

export function parseCourseTitle(s) {
  const match = /^([A-Z]+) ([A-Z0-9]+) - (.+)$/.exec(clean(s));
  if (!match) return null;
  const [, subject, number, title] = match;
  return { code: `${subject} ${number}`, subject, title };
}

// Rows that aren't real sections.
const PLACEHOLDERS = [
  ["interest-list", /^[A-Z0-9]*\s*-\s*Interest List\b/i],
  ["cancelled", /^X\s+cancel/i],
];

// "MA 1021-AD02 (group 2) - Calculus I" → course "MA 1021", code "AD02".
// The group note goes. Suffixes like "BX03-A" stay, they tell sections apart.
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

export function parseSectionCode(s) {
  return parseCourseSection(s)?.code ?? null;
}

export function parseFraction(s) {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(clean(s));
  if (!match) return null;
  return { taken: Number(match[1]), capacity: Number(match[2]) };
}

export function parseInstructors(s) {
  return [...new Set((s ?? "").split(";").map(clean).filter(Boolean))];
}

export function parseCredits(s) {
  const text = clean(s);
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

// If WPI gives no level, the course number decides: 500-999 and 5000+ are graduate.
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
  // WPI's listing says "Discussion" for what the catalog calls a conference.
  ["discussion", "discussion"],
  ["conference", "discussion"],
  ["seminar", "seminar"],
  ["workshop", "workshop"],
]);

export function normalizeType(s) {
  return TYPES.get(clean(s).toLowerCase()) ?? "other";
}

export function normalizeStatus(s) {
  const status = clean(s).toLowerCase();
  return ["open", "closed", "waitlist"].includes(status) ? status : null;
}

// The location is the only place WPI says whether an online section is sync or async.
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

export function cleanDescription(html) {
  const text = clean(
    (html ?? "")
      // Block tags separate words. Inline ones can sit in the middle of a word.
      .replace(BLOCK_TAGS, " ")
      .replace(/<\/?[a-zA-Z][^>]*>/g, "")
      .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity),
  );
  // WPI glues the category to the first word ("Cat. IThis course"). An "I" only
  // starts that word if a lowercase letter follows, so "Cat. II GOV 1320" stays as it is.
  return text.replace(/^Cat\. (III|II|I)(?=[A-HJ-Z]|I[a-z])/, "Cat. $1 ");
}
