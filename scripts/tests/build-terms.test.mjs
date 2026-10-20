import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  buildCourse,
  buildSection,
  buildTerms,
  collectUnparsed,
  skipReason,
  unscheduledSections,
  validateTerm,
} from "../lib/build-terms.mjs";
import { formatIndexFile, formatTermFile } from "../lib/format-json.mjs";

const fixture = (name) => new URL(`../../data/fixtures/${name}`, import.meta.url);
const sample = JSON.parse(readFileSync(fixture("sample-sections.json"), "utf8")).Report_Entry;
const sampleRow = (id) => sample.find((r) => r.Course_Section.startsWith(`${id} - `));

const row = (course, code, fields = {}) => ({
  Course_Title: `${course} - Sample Course`,
  Course_Section: `${course}-${code} - Sample Course`,
  Offering_Period: "2026 Fall A Term",
  Instructional_Format: "Lecture",
  Meeting_Patterns: "M-T-R-F | 9:00 AM - 9:50 AM",
  Locations: "Fuller Labs 311",
  Section_Details: "Fuller Labs 311 | M-T-R-F | 9:00 AM - 9:50 AM",
  Instructors: "Ye Lu",
  Delivery_Mode: "In-Person",
  Section_Status: "Open",
  Enrolled_Capacity: "10/20",
  Waitlist_Waitlist_Capacity: "0/5",
  Credits: "3",
  Academic_Level: "Undergraduate",
  CF_LRV_Cluster_Ref_ID: "",
  Course_Description: "<p>A sample course.</p>",
  Course_Section_Start_Date: "2026-08-20",
  Course_Section_End_Date: "2026-10-09",
  ...fields,
});

const B_TERM = {
  Offering_Period: "2026 Fall B Term",
  Course_Section_Start_Date: "2026-10-19",
  Course_Section_End_Date: "2026-12-11",
};
const FALL_SEMESTER = {
  Offering_Period: "2026 Fall Semester",
  Course_Section_Start_Date: "2026-08-20",
  Course_Section_End_Date: "2026-12-11",
};

const termById = (terms, id) => terms.find((t) => t.term.id === id);
const sectionById = (term, id) => term.courses.flatMap((c) => c.sections).find((s) => s.id === id);

describe("buildSection", () => {
  it("builds a clean section from a real row", () => {
    const section = buildSection(sampleRow("AE 2320-CX01"));
    assert.deepEqual(
      {
        id: section.id,
        code: section.code,
        type: section.type,
        status: section.status,
        enrolled: section.enrolled,
        capacity: section.capacity,
        waitlist: section.waitlist,
        instructors: section.instructors,
        delivery: section.delivery,
        meetings: section.meetings,
      },
      {
        id: "AE 2320-CX01",
        code: "CX01",
        type: "lab",
        status: "closed",
        enrolled: 40,
        capacity: 40,
        waitlist: { taken: 0, capacity: 0 },
        instructors: ["Ye Lu"],
        delivery: "in-person",
        meetings: [
          {
            days: ["Thu"],
            start: 840,
            end: 890,
            location: "Higgins Labs 230 Geom Modeling Computer Lab",
          },
        ],
      },
    );
    assert.equal(section.cluster, "STUDENT_COURSE_SECTION_CLUSTER-3-5323");
    assert.equal(section.course, "AE 2320");
  });

  it("keeps the real numbers of an over-enrolled section", () => {
    const section = buildSection(sampleRow("AB 1531-A01"));
    assert.equal(section.status, "waitlist");
    assert.equal(section.enrolled, 21);
    assert.equal(section.capacity, 20);
    assert.deepEqual(section.waitlist, { taken: 0, capacity: 9 });
  });

  it("uses [] when no instructor is assigned", () => {
    assert.deepEqual(buildSection(sampleRow("AE 4310-C01")).instructors, []);
  });

  it("gives an online section with no meeting time an empty meetings list", () => {
    const section = buildSection(
      row("AE 5131", "C01", {
        Delivery_Mode: "Online",
        Meeting_Patterns: "",
        Locations: "Online-asynchronous",
        Section_Details: "Online-asynchronous |",
        Academic_Level: "Graduate",
      }),
    );
    assert.deepEqual(section.meetings, []);
    assert.equal(section.delivery, "online-async");
    assert.equal(section.level, "Graduate");
  });

  it("still builds a section when WPI leaves fields out", () => {
    const section = buildSection({
      Course_Title: "AE 5131 - Incompressible Fluid Dynamics",
      Course_Section: "AE 5131-C01 - Incompressible Fluid Dynamics",
    });
    assert.equal(section.id, "AE 5131-C01");
    assert.equal(section.level, "Graduate");
    assert.equal(section.credits, null);
    assert.equal(section.dates, null);
    assert.deepEqual(section.meetings, []);
  });

  it("reports values it cannot read and keeps going", () => {
    const unparsed = collectUnparsed();
    const section = buildSection(
      row("AE 2320", "CL01", {
        Section_Status: "On Hold",
        Enrolled_Capacity: "full",
        Meeting_Patterns: "M-W | noon - 1:00 PM",
      }),
      { onUnparsed: unparsed.add },
    );
    assert.equal(section.status, "on-hold");
    assert.equal(section.enrolled, 0);
    assert.deepEqual(section.meetings, []);
    assert.deepEqual(
      unparsed.entries().map(({ field, value, examples }) => [field, value, examples]),
      [
        ["Enrolled_Capacity", "full", ["AE 2320-CL01"]],
        ["Meeting_Patterns", "M-W | noon - 1:00 PM", ["AE 2320-CL01"]],
        ["Section_Status", "On Hold", ["AE 2320-CL01"]],
      ],
    );
  });

  it("returns null for a row it cannot identify", () => {
    assert.equal(buildSection({ Course_Title: "???", Course_Section: "???" }), null);
  });
});

describe("skipReason", () => {
  it("keeps real sections and names the rows that are not", () => {
    assert.equal(skipReason(sampleRow("AE 2320-CL01")), null);
    assert.equal(
      skipReason({
        Course_Title: "CH 1010 - Chemical Properties, Bonding, And Forces",
        Course_Section: "CH 1010-AL-Interest List - Chemical Properties, Bonding, And Forces",
      }),
      "interest-list",
    );
    assert.equal(
      skipReason({
        Course_Title: "CS 1005 - Programming for Engineers",
        Course_Section: "CS 1005-X cancel 8.19.26 - Programming for Engineers",
      }),
      "cancelled",
    );
    assert.equal(skipReason({ Course_Title: "", Course_Section: "" }), "unreadable");
  });
});

describe("buildCourse", () => {
  const rows = sample.filter((r) => r.Course_Title.startsWith("AE 2320"));
  const term = { id: "2027-C", start: "2027-01-13", end: "2027-03-05" };

  it("turns AE 2320's lecture and three labs into one course with three options", () => {
    const course = buildCourse(rows, { term });
    assert.deepEqual(Object.keys(course), [
      "code",
      "subject",
      "title",
      "credits",
      "level",
      "description",
      "sections",
      "options",
    ]);
    assert.equal(course.code, "AE 2320");
    assert.equal(course.subject, "AE");
    assert.equal(course.title, "Introduction to Orbital Mechanics");
    assert.equal(course.credits, 3);
    assert.equal(course.level, "Undergraduate");
    assert.deepEqual(
      course.sections.map((s) => s.id),
      ["AE 2320-CL01", "AE 2320-CX01", "AE 2320-CX02", "AE 2320-CX03"],
    );
    assert.deepEqual(course.options, [
      ["AE 2320-CL01", "AE 2320-CX01"],
      ["AE 2320-CL01", "AE 2320-CX02"],
      ["AE 2320-CL01", "AE 2320-CX03"],
    ]);
  });

  it("stores the description once, on the course", () => {
    const course = buildCourse(rows, { term });
    assert.equal(course.description, "Shortened for the fixture.");
    for (const section of course.sections) {
      assert.deepEqual(Object.keys(section), [
        "id",
        "code",
        "type",
        "status",
        "enrolled",
        "capacity",
        "waitlist",
        "instructors",
        "delivery",
        "meetings",
      ]);
    }
  });

  it("gives the same result whatever order the rows come in", () => {
    assert.deepEqual(buildCourse([...rows].reverse(), { term }), buildCourse(rows, { term }));
  });

  it("gives a section its own title, description or credits only when they differ", () => {
    const course = buildCourse([
      row("HU 3900", "A01", {
        Course_Title: "HU 3900 - Inquiry Seminar In Humanities And Arts",
        Course_Section: "HU 3900-A01 - INQ SEM: Early American History",
        Course_Description: "<p>Cat. IA seminar.</p>",
      }),
      row("HU 3900", "A02", {
        Course_Title: "HU 3900 - Inquiry Seminar In Humanities And Arts",
        Course_Section: "HU 3900-A02 - Inquiry Seminar in Humanities and Arts.",
        Course_Description: "Cat. I<br />A seminar.",
      }),
      row("HU 3900", "A03", {
        Course_Title: "HU 3900 - Inquiry Seminar In Humanities And Arts",
        Course_Section: "HU 3900-A03 - INQ SEM: History of Sports",
        Course_Description: "<p>Why do we play?</p>",
        Credits: "1.5",
      }),
    ]);
    assert.equal(course.title, "Inquiry Seminar In Humanities And Arts");
    assert.equal(course.description, "Cat. I A seminar.");
    assert.equal(course.credits, 3);

    const [a01, a02, a03] = course.sections;
    assert.equal(a01.title, "INQ SEM: Early American History");
    assert.equal("title" in a02, false, "a title that only differs in case is not repeated");
    assert.equal("description" in a01, false);
    assert.equal("description" in a02, false);
    assert.equal("credits" in a01, false);
    assert.equal(a03.title, "INQ SEM: History of Sports");
    assert.equal(a03.description, "Why do we play?");
    assert.equal(a03.credits, 1.5);
  });

  it("lists a section once when WPI repeats a row", () => {
    const unparsed = collectUnparsed();
    const course = buildCourse([rows[0], rows[1], rows[1]], { term, onUnparsed: unparsed.add });
    assert.equal(course.sections.length, 2);
    assert.equal(unparsed.entries()[0].value, "listed more than once");
  });

  it("checks overlaps using only the meetings in the requested term", () => {
    const course = buildCourse(
      [
        row("MA 1024", "FL04", {
          ...FALL_SEMESTER,
          Meeting_Patterns:
            "M | 9:00 AM - 9:50 AM | 08/20/2026 - 10/09/2026; " +
            "T | 10:00 AM - 10:50 AM | 10/19/2026 - 12/11/2026",
          Section_Details:
            "Fuller Labs 311 | M | 9:00 AM - 9:50 AM | 08/20/2026 - 10/09/2026; " +
            "Fuller Labs 311 | T | 10:00 AM - 10:50 AM | 10/19/2026 - 12/11/2026",
        }),
        row("MA 1024", "FX08", {
          ...FALL_SEMESTER,
          Instructional_Format: "Laboratory",
          Meeting_Patterns: "M | 9:00 AM - 9:50 AM",
          Section_Details: "Fuller Labs 311 | M | 9:00 AM - 9:50 AM",
        }),
      ],
      { term: { id: "2026-B", start: "2026-10-19", end: "2026-12-11" } },
    );
    assert.deepEqual(course.options, [["MA 1024-FL04", "MA 1024-FX08"]]);
  });
});

describe("buildTerms", () => {
  it("builds one term per lettered period, in date order", () => {
    const { terms, report } = buildTerms(sample);
    assert.deepEqual(
      terms.map((t) => t.term),
      [
        {
          id: "2026-A",
          name: "A Term",
          season: "Fall",
          year: 2026,
          start: "2026-08-20",
          end: "2026-10-09",
        },
        {
          id: "2026-B",
          name: "B Term",
          season: "Fall",
          year: 2026,
          start: "2026-10-19",
          end: "2026-12-11",
        },
        {
          id: "2027-C",
          name: "C Term",
          season: "Spring",
          year: 2027,
          start: "2027-01-13",
          end: "2027-03-05",
        },
      ],
    );
    assert.deepEqual(
      termById(terms, "2027-C").courses.map((c) => c.code),
      ["AE 2320", "AE 4310"],
    );
    assert.deepEqual(report, { skipped: {}, placed: [], unplaced: [], droppedOptions: [] });
  });

  it("leaves out interest lists and cancelled sections", () => {
    const { terms, report } = buildTerms([
      row("CH 1010", "AL01"),
      row("CH 1010", "AL", {
        Course_Section: "CH 1010-AL-Interest List - Sample Course",
        CF_LRV_Cluster_Ref_ID: "STUDENT_COURSE_SECTION_CLUSTER-3-5117",
        Meeting_Patterns: "",
      }),
      row("CH 1010", "AX", {
        Course_Section: "CH 1010-AX-Interest List - Sample Course",
        Instructional_Format: "Laboratory",
        CF_LRV_Cluster_Ref_ID: "STUDENT_COURSE_SECTION_CLUSTER-3-5117",
        Meeting_Patterns: "",
      }),
      row("CS 1005", "X", { Course_Section: "CS 1005-X cancel 8.19.26 - Sample Course" }),
    ]);
    assert.deepEqual(report.skipped, { "interest-list": 2, cancelled: 1 });
    assert.deepEqual(
      terms[0].courses.map((c) => c.code),
      ["CH 1010"],
    );
    assert.deepEqual(terms[0].courses[0].options, [["CH 1010-AL01"]]);
  });

  it("puts a semester-long section into both terms it runs through", () => {
    const { terms, report } = buildTerms([
      row("AE 2320", "A01"),
      row("AE 2320", "B01", B_TERM),
      row("MA 501", "F01", {
        ...FALL_SEMESTER,
        Meeting_Patterns:
          "T-F | 2:00 PM - 3:20 PM | 10/19/2026 - 12/11/2026; " +
          "T-F | 2:00 PM - 3:20 PM | 08/20/2026 - 10/09/2026",
        Locations: "Fuller Labs 311; Salisbury Labs 411",
        Section_Details:
          "Fuller Labs 311 | T-F | 2:00 PM - 3:20 PM | 10/19/2026 - 12/11/2026; " +
          "Salisbury Labs 411 | T-F | 2:00 PM - 3:20 PM | 08/20/2026 - 10/09/2026",
      }),
    ]);
    assert.deepEqual(report.placed, [
      { period: "2026 Fall Semester", rows: 1, into: ["2026-A", "2026-B"] },
    ]);

    const inA = sectionById(termById(terms, "2026-A"), "MA 501-F01");
    const inB = sectionById(termById(terms, "2026-B"), "MA 501-F01");
    assert.deepEqual(inA.dates, { start: "2026-08-20", end: "2026-12-11" });
    assert.deepEqual(inA.meetings, [
      { days: ["Tue", "Fri"], start: 840, end: 920, location: "Salisbury Labs 411" },
    ]);
    assert.deepEqual(inB.meetings, [
      { days: ["Tue", "Fri"], start: 840, end: 920, location: "Fuller Labs 311" },
    ]);
    assert.equal("dates" in sectionById(termById(terms, "2026-A"), "AE 2320-A01"), false);
  });

  it("places a late-start section only into the term it overlaps", () => {
    const { terms } = buildTerms([
      row("AE 2320", "A01"),
      row("AE 2320", "B01", B_TERM),
      row("SYS 501", "LS01", {
        Offering_Period: "2026 Fall Late Start Online",
        Course_Section_Start_Date: "2026-11-02",
        Course_Section_End_Date: "2027-01-15",
      }),
    ]);
    assert.equal(sectionById(termById(terms, "2026-A"), "SYS 501-LS01"), undefined);
    assert.deepEqual(sectionById(termById(terms, "2026-B"), "SYS 501-LS01").dates, {
      start: "2026-11-02",
      end: "2027-01-15",
    });
  });

  it("never pairs a semester-long lecture with a one-term lab", () => {
    const { terms } = buildTerms([
      row("RBE 595", "AL01"),
      row("RBE 595", "AX01", {
        Instructional_Format: "Laboratory",
        Meeting_Patterns: "W | 10:00 AM - 10:50 AM",
        Section_Details: "Fuller Labs 311 | W | 10:00 AM - 10:50 AM",
      }),
      row("RBE 595", "F02", FALL_SEMESTER),
    ]);
    const course = termById(terms, "2026-A").courses[0];
    assert.deepEqual(course.options, [["RBE 595-AL01", "RBE 595-AX01"], ["RBE 595-F02"]]);
  });

  it("reports sections of a period that no lettered term overlaps", () => {
    const { terms, report } = buildTerms([
      row("AE 2320", "A01"),
      row("AE 2320", "E01", {
        Offering_Period: "2027 Summer Session",
        Course_Section_Start_Date: "2027-05-17",
        Course_Section_End_Date: "2027-07-02",
      }),
    ]);
    assert.equal(terms.length, 1);
    assert.deepEqual(report.unplaced, [{ period: "2027 Summer Session", rows: 1 }]);
  });
});

describe("validateTerm", () => {
  const warnings = [];
  const warn = (message) => warnings.push(message);

  it("finds nothing wrong with real data", () => {
    for (const term of buildTerms(sample).terms) {
      assert.equal(validateTerm(term, warn), 0);
    }
    assert.deepEqual(warnings, []);
  });

  it("counts every broken meeting, number and option", () => {
    const [term] = buildTerms([row("AE 2320", "A01"), row("AE 2320", "A02")]).terms;
    const [a01, a02] = term.courses[0].sections;
    a01.meetings[0].end = a01.meetings[0].start;
    a01.enrolled = Number.NaN;
    a02.id = "AE 2320-A01";
    a02.meetings[0].days = ["Thursday"];
    term.courses[0].options = [["AE 2320-A99"]];
    term.courses.push({ ...term.courses[0], code: "AE 9999", sections: [], options: [] });

    assert.equal(validateTerm(term, warn), 6);
    assert.equal(warnings.length, 6);
    assert.match(warnings.join("\n"), /2026-A AE 2320-A01: meeting starts at 540 but ends at 540/);
    assert.match(warnings.join("\n"), /enrolled is NaN/);
    assert.match(warnings.join("\n"), /section id is used twice/);
    assert.match(warnings.join("\n"), /meeting days are \["Thursday"\]/);
    assert.match(warnings.join("\n"), /option points to missing section AE 2320-A99/);
    assert.match(warnings.join("\n"), /AE 9999: course has no options/);
  });

  it("needs the term's dates, which decide whether the term is still published", () => {
    const messages = [];
    const [term] = buildTerms([row("AE 2320", "A01", { Course_Section_End_Date: "" })]).terms;
    assert.equal(term.term.end, null);
    assert.equal(validateTerm(term, (message) => messages.push(message)), 1);
    assert.match(messages[0], /2026-A term: dates are null to null/);
  });
});

describe("unscheduledSections", () => {
  it("lists sections that are in no option", () => {
    const { terms } = buildTerms([
      row("IMGD 2030", "AL01", { CF_LRV_Cluster_Ref_ID: "5372" }),
      row("IMGD 2030", "AX01", {
        CF_LRV_Cluster_Ref_ID: "5372",
        Instructional_Format: "Laboratory",
        Meeting_Patterns: "W | 10:00 AM - 10:50 AM",
        Section_Details: "Fuller Labs 311 | W | 10:00 AM - 10:50 AM",
      }),
      row("IMGD 2030", "AX02", { Instructional_Format: "Laboratory" }),
    ]);
    assert.deepEqual(unscheduledSections(terms[0]), ["IMGD 2030-AX02"]);
  });
});

describe("collectUnparsed", () => {
  it("counts repeats and remembers a few examples", () => {
    const unparsed = collectUnparsed();
    for (const id of ["A", "B", "C", "D"]) unparsed.add("Meeting_Patterns", "M | noon", id);
    unparsed.add("Delivery_Mode", "Carrier Pigeon", "E");
    assert.deepEqual(unparsed.entries(), [
      { field: "Delivery_Mode", value: "Carrier Pigeon", count: 1, examples: ["E"] },
      { field: "Meeting_Patterns", value: "M | noon", count: 4, examples: ["A", "B", "C"] },
    ]);
  });
});

describe("the term file", () => {
  const { terms } = buildTerms(sample);
  const cTerm = { ...termById(terms, "2027-C"), generatedAt: "2026-10-11T14:00:00Z" };

  it("is valid JSON that reads back as the same data", () => {
    const text = formatTermFile(cTerm);
    assert.deepEqual(JSON.parse(text), {
      term: cTerm.term,
      generatedAt: cTerm.generatedAt,
      courses: cTerm.courses,
    });
    assert.ok(text.endsWith("}\n"));
  });

  it("has one section and one option per line", () => {
    const lines = formatTermFile(cTerm).split("\n");
    assert.equal(lines.filter((line) => line.startsWith('        {"id":')).length, 5);
    assert.equal(lines.filter((line) => line.startsWith('        ["AE ')).length, 4);
  });

  it("matches data/fixtures/2027-C.small.json", () => {
    // If the format changed on purpose, rebuild the fixture (TODAY keeps C Term published):
    //   TODAY=2027-01-13 node scripts/normalize.mjs data/fixtures/sample-sections.json /tmp/goatplan
    //   cp /tmp/goatplan/2027-C.json data/fixtures/2027-C.small.json
    const saved = readFileSync(fixture("2027-C.small.json"), "utf8");
    const { generatedAt } = JSON.parse(saved);
    assert.equal(formatTermFile({ ...cTerm, generatedAt }), saved);
  });

  it("has an index with one term per line", () => {
    const index = {
      terms: terms.map(({ term, courses }) => ({
        ...term,
        status: "upcoming",
        courses: courses.length,
      })),
    };
    const text = formatIndexFile(index);
    assert.deepEqual(JSON.parse(text), index);
    assert.equal(text.split("\n").filter((line) => line.startsWith('    {"id":')).length, 3);
  });
});
