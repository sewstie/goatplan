import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
  parseSectionCode,
  parseTerm,
} from "../lib/parse-fields.mjs";

describe("parseTerm", () => {
  it("turns a lettered term into an id", () => {
    assert.deepEqual(parseTerm("2027 Spring C Term"), {
      id: "2027-C",
      name: "C Term",
      season: "Spring",
      year: 2027,
    });
    assert.deepEqual(parseTerm("2026 Fall A Term"), {
      id: "2026-A",
      name: "A Term",
      season: "Fall",
      year: 2026,
    });
  });

  it("returns null for periods that are not a lettered term", () => {
    assert.equal(parseTerm("2026 Fall Semester"), null);
    assert.equal(parseTerm("2027 Spring Late Start Online"), null);
    assert.equal(parseTerm(""), null);
    assert.equal(parseTerm(undefined), null);
  });
});

describe("parseCourseTitle", () => {
  it("splits the code, subject and title", () => {
    assert.deepEqual(parseCourseTitle("AE 2320 - Introduction to Orbital Mechanics"), {
      code: "AE 2320",
      subject: "AE",
      title: "Introduction to Orbital Mechanics",
    });
  });

  it("only splits on the first dash", () => {
    assert.equal(
      parseCourseTitle("WPE 1204 - Club Sport - Dance Team").title,
      "Club Sport - Dance Team",
    );
    assert.equal(
      parseCourseTitle("PH 1120 - General Physics-Electricity And Magnetism").title,
      "General Physics-Electricity And Magnetism",
    );
  });

  it("reads graduate and experimental course numbers", () => {
    assert.equal(parseCourseTitle("MA 501 - Engineering Mathematics").code, "MA 501");
    assert.equal(parseCourseTitle("IGS 410X - Experimental Course").code, "IGS 410X");
  });

  it("collapses extra spaces and returns null for other text", () => {
    assert.equal(
      parseCourseTitle("EDU 2200 - Community  Engagement & Pre-Practicum in Teaching").title,
      "Community Engagement & Pre-Practicum in Teaching",
    );
    assert.equal(parseCourseTitle("Introduction to Orbital Mechanics"), null);
    assert.equal(parseCourseTitle(""), null);
  });
});

describe("parseSectionCode", () => {
  it("reads the section code", () => {
    assert.equal(parseSectionCode("AE 2320-CX01 - Introduction to Orbital Mechanics"), "CX01");
    assert.equal(parseSectionCode("AB 1531-A01 - Elementary Arabic I"), "A01");
    assert.equal(parseSectionCode("CP 1001-A101 - A Term Co-Op: MIT Lincoln Lab."), "A101");
  });

  it("drops the group note wherever WPI puts it", () => {
    assert.equal(parseSectionCode("MA 1021-AD02 (group 2) - Calculus I"), "AD02");
    assert.equal(parseSectionCode("MA 2621-DD03  (group 1) - Probability For Applications"), "DD03");
    assert.equal(parseSectionCode("MA 1023-CD06 - Calculus III (group 4)"), "CD06");
  });

  it("keeps suffixes that tell two sections apart", () => {
    assert.equal(parseSectionCode("FY 1101-BX03-A - GPS: Shelter the World"), "BX03-A");
    assert.equal(parseSectionCode("FY 1101-BX03-B - GPS: Shelter the World"), "BX03-B");
    assert.equal(
      parseSectionCode("PH 1120-BS01-Multipurpose - General Physics-Electricity And Magnetism"),
      "BS01-Multipurpose",
    );
    assert.equal(parseSectionCode("MA 1024-AD03-ACL (group 2) - Calculus IV"), "AD03-ACL");
  });

  it("returns null for text that is not a section", () => {
    assert.equal(parseSectionCode("Calculus I"), null);
    assert.equal(parseSectionCode(""), null);
  });
});

describe("parseCourseSection", () => {
  it("returns the course, code and the section's own title", () => {
    assert.deepEqual(parseCourseSection("HU 3900-A03 - INQ SEM: Early American History"), {
      course: "HU 3900",
      code: "A03",
      title: "INQ SEM: Early American History",
      placeholder: null,
    });
    assert.equal(
      parseCourseSection("MA 1023-CD06 - Calculus III (group 4)").title,
      "Calculus III",
    );
  });

  it("recognises interest lists", () => {
    for (const text of [
      "CH 1010-AL-Interest List - Chemical Properties, Bonding, And Forces",
      "CS 3733-BL - Interest List - Software Engineering",
      "MA 1020-FD-Interest List - Calculus I With Preliminary Topics",
    ]) {
      assert.equal(parseCourseSection(text).placeholder, "interest-list", text);
    }
  });

  it("recognises cancelled sections", () => {
    for (const text of [
      "AE 6532-X Cancel - 03/17/2026 - Computational Solid Mechanics",
      "AR 2750-X cancel 3.30.26 - Topics In Studio Art: Art in the Makerspace",
    ]) {
      assert.equal(parseCourseSection(text).placeholder, "cancelled", text);
    }
  });
});

describe("parseFraction", () => {
  it("reads taken and capacity", () => {
    assert.deepEqual(parseFraction("85/120"), { taken: 85, capacity: 120 });
    assert.deepEqual(parseFraction("0/0"), { taken: 0, capacity: 0 });
  });

  it("keeps over-enrolled values as they are", () => {
    assert.deepEqual(parseFraction("21/20"), { taken: 21, capacity: 20 });
    assert.deepEqual(parseFraction("73/999"), { taken: 73, capacity: 999 });
  });

  it("returns null for anything else", () => {
    for (const text of ["", "85", "85/", "a/b", "-1/20", undefined]) {
      assert.equal(parseFraction(text), null, `parseFraction(${JSON.stringify(text)})`);
    }
  });
});

describe("parseInstructors", () => {
  it("splits names on semicolons", () => {
    assert.deepEqual(parseInstructors("Ye Lu"), ["Ye Lu"]);
    assert.deepEqual(parseInstructors("Shichao Liu; Nan Ma"), ["Shichao Liu", "Nan Ma"]);
    assert.deepEqual(parseInstructors("Kathryn (Katie) Crockett; Amanda Wittman"), [
      "Kathryn (Katie) Crockett",
      "Amanda Wittman",
    ]);
  });

  it("returns [] when nobody is assigned", () => {
    assert.deepEqual(parseInstructors(""), []);
    assert.deepEqual(parseInstructors(undefined), []);
    assert.deepEqual(parseInstructors(" ; "), []);
  });

  it("lists a repeated name once", () => {
    assert.deepEqual(parseInstructors("Ye Lu; Ye Lu"), ["Ye Lu"]);
  });
});

describe("parseCredits and parseLevel", () => {
  it("reads credits as a number", () => {
    assert.equal(parseCredits("3"), 3);
    assert.equal(parseCredits("0.75"), 0.75);
    assert.equal(parseCredits("0"), 0);
    assert.equal(parseCredits(""), null);
    assert.equal(parseCredits("three"), null);
  });

  it("uses WPI's level, or the course number when it is missing", () => {
    assert.equal(parseLevel("Graduate", "AE 2320"), "Graduate");
    assert.equal(parseLevel("", "AE 2320"), "Undergraduate");
    assert.equal(parseLevel("", "IGS 410X"), "Undergraduate");
    assert.equal(parseLevel("", "AE 5131"), "Graduate");
    assert.equal(parseLevel(undefined, "MA 501"), "Graduate");
  });
});

describe("normalizeType", () => {
  it("maps WPI's instructional formats", () => {
    assert.equal(normalizeType("Lecture"), "lecture");
    assert.equal(normalizeType("Laboratory"), "lab");
    assert.equal(normalizeType("Discussion"), "discussion");
    assert.equal(normalizeType("Conference"), "discussion");
    assert.equal(normalizeType("Seminar"), "seminar");
    assert.equal(normalizeType("Workshop"), "workshop");
  });

  it("calls everything else other", () => {
    for (const text of ["Experiential", "Independent Study", "Internship", "Research", ""]) {
      assert.equal(normalizeType(text), "other", text);
    }
  });
});

describe("normalizeStatus", () => {
  it("lowercases the three statuses and rejects the rest", () => {
    assert.equal(normalizeStatus("Open"), "open");
    assert.equal(normalizeStatus("Closed"), "closed");
    assert.equal(normalizeStatus("Waitlist"), "waitlist");
    assert.equal(normalizeStatus("Cancelled"), null);
    assert.equal(normalizeStatus(""), null);
  });
});

describe("normalizeDelivery", () => {
  it("maps the delivery modes", () => {
    assert.equal(normalizeDelivery("In-Person"), "in-person");
    assert.equal(normalizeDelivery("Hybrid"), "hybrid");
    assert.equal(normalizeDelivery("Online"), "online");
    assert.equal(normalizeDelivery("Carrier Pigeon"), null);
  });

  it("uses the location to tell the online variants apart", () => {
    assert.equal(normalizeDelivery("Online", "Online-asynchronous"), "online-async");
    assert.equal(normalizeDelivery("Online", "Online-synchronous"), "online-sync");
    assert.equal(normalizeDelivery("Online", ""), "online");
    assert.equal(normalizeDelivery("Hybrid", "Online-asynchronous"), "hybrid");
    assert.equal(normalizeDelivery("In-Person", "Fuller Labs 311"), "in-person");
  });
});

describe("cleanDescription", () => {
  it("strips tags and collapses whitespace", () => {
    assert.equal(
      cleanDescription("<p>An introductory course.</p>\n<p>It covers   <i>orbits</i>.</p>"),
      "An introductory course. It covers orbits.",
    );
    assert.equal(cleanDescription("<ul><li>One</li><li>Two</li></ul>"), "One Two");
  });

  it("does not split a word that an inline tag runs through", () => {
    assert.equal(
      cleanDescription('<p><span style="color:#4a4a4a"><span>This</span></span>&nbsp;course</p>'),
      "This course",
    );
    assert.equal(cleanDescription("<b>H</b>ello"), "Hello");
  });

  it("decodes the entities WPI uses", () => {
    assert.equal(cleanDescription("Research &amp; writing"), "Research & writing");
    assert.equal(cleanDescription("summer &#43; B term"), "summer + B term");
    assert.equal(cleanDescription("a student&#39;s &#34;plan&#34;"), 'a student\'s "plan"');
    assert.equal(cleanDescription("x &lt; y &#x3e; z"), "x < y > z");
    assert.equal(cleanDescription("&amp;lt; &bogus;"), "&lt; &bogus;");
  });

  it("separates the catalog category from the first word", () => {
    assert.equal(cleanDescription("<p>Cat. IAn intensive course.</p>"), "Cat. I An intensive course.");
    assert.equal(cleanDescription("<p>Cat. I<br /><br />This course</p>"), "Cat. I This course");
    assert.equal(cleanDescription("Cat. IIThe engineers"), "Cat. II The engineers");
    assert.equal(cleanDescription("Cat. IIn this course"), "Cat. I In this course");
    assert.equal(cleanDescription("Cat. IIntroduction to"), "Cat. I Introduction to");
    assert.equal(cleanDescription("Cat. IMA 1021 is"), "Cat. I MA 1021 is");
  });

  it("leaves a category that is already separate alone", () => {
    assert.equal(
      cleanDescription("<p>Cat. II</p><p></p><p>GOV 1320 is a survey course</p>"),
      "Cat. II GOV 1320 is a survey course",
    );
    assert.equal(cleanDescription("Cat. III This course"), "Cat. III This course");
    assert.equal(cleanDescription("Cat. I, This course"), "Cat. I, This course");
  });

  it("returns an empty string for a missing description", () => {
    assert.equal(cleanDescription(""), "");
    assert.equal(cleanDescription(undefined), "");
    assert.equal(cleanDescription("<p></p>"), "");
  });
});
