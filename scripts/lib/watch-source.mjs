// Checks how often WPI regenerates its file. What it measures is in docs/data-format.md.

import { createHash } from "node:crypto";

const SEAT_FIELDS = ["Enrolled_Capacity", "Waitlist_Waitlist_Capacity", "Section_Status"];

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const hashRows = (rows) => sha256(JSON.stringify(rows.map((row) => JSON.stringify(row)).sort()));

function withoutSeats(row) {
  const rest = {};
  for (const key of Object.keys(row).sort()) {
    if (!SEAT_FIELDS.includes(key)) rest[key] = row[key];
  }
  return rest;
}

export function fingerprint(data) {
  const rows = data.Report_Entry;
  return {
    seatsHash: hashRows(rows.map((row) => [row.Course_Section, ...SEAT_FIELDS.map((key) => row[key])])),
    structureHash: hashRows(rows.map(withoutSeats)),
  };
}

export function classify(previous, next) {
  const seats = previous.seatsHash !== next.seatsHash;
  const structure = previous.structureHash !== next.structureHash;
  if (seats && structure) return "both";
  if (seats) return "seats-only";
  if (structure) return "structure";
  return "unchanged";
}

export const SOURCE_URL = "https://courselistings.wpi.edu/assets/prod-data.json";

function requestHeaders(state) {
  const headers = { "User-Agent": "GoatPlan course planner (student project)" };
  if (state?.etag) headers["If-None-Match"] = state.etag;
  if (state?.lastModified) headers["If-Modified-Since"] = state.lastModified;
  return headers;
}

const describe = (err) => (err.cause?.message ? `${err.message}: ${err.cause.message}` : err.message);

export async function checkSource(state, { fetch, now = new Date(), url = SOURCE_URL }) {
  const checkedAt = now.toISOString();
  try {
    return await check(state, { fetch, checkedAt, url });
  } catch (err) {
    return { entry: { checkedAt, status: "error", message: describe(err) }, state };
  }
}

const enrolled = (row) => Number.parseInt(row.Enrolled_Capacity, 10) || 0;

async function check(state, { fetch, checkedAt, url }) {
  const res = await fetch(url, { headers: requestHeaders(state), signal: AbortSignal.timeout(60_000) });
  if (res.status !== 304 && !res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());

  const entry = {
    checkedAt,
    status: res.status,
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    contentLength: res.headers.get("content-length"),
    cacheControl: res.headers.get("cache-control"),
    age: res.headers.get("age"),
  };
  if (res.status === 304) {
    return {
      entry: { ...entry, bodyHash: state?.bodyHash ?? null, change: "unchanged (304)" },
      state: { ...state, etag: entry.etag ?? state?.etag, lastModified: entry.lastModified ?? state?.lastModified },
    };
  }

  const body = await res.text();
  const data = JSON.parse(body);
  if (!Array.isArray(data?.Report_Entry)) throw new Error('No "Report_Entry" array in the file');
  const next = { etag: entry.etag, lastModified: entry.lastModified, bodyHash: sha256(body), ...fingerprint(data) };
  return {
    entry: {
      ...entry,
      bodyHash: next.bodyHash,
      change: state?.seatsHash ? classify(state, next) : "first",
      sectionCount: data.Report_Entry.length,
      enrolledTotal: data.Report_Entry.reduce((sum, row) => sum + enrolled(row), 0),
    },
    state: next,
  };
}
