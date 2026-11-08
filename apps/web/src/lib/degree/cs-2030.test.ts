import { describe, expect, it } from "vitest";
import rules from "./sheets/cs-2030.json";

describe("cs-2030 degree rules", () => {
  describe("metadata", () => {
    it("identifies the major and class year", () => {
      expect(rules.major).toBe("Computer Science");
      expect(rules.classYear).toBe(2030);
      expect(rules.catalogYear).toBe("2026-2027");
    });

    it("records its source", () => {
      expect(rules.source).toContain("CS-2030");
      expect(rules.catalogSource).toContain("cleancatalog.net");
    });

    it("requires 15 total units and 8 residency units", () => {
      expect(rules.totalUnits).toBe(15);
      expect(rules.residencyUnits).toBe(8);
    });
  });

  describe("lines", () => {
    it("has exactly 45 lines", () => {
      expect(rules.lines).toHaveLength(45);
    });

    it("numbers lines 1 through 45 with no gaps or duplicates", () => {
      const lineNumbers = rules.lines.map((l) => l.line);
      const expected = Array.from({ length: 45 }, (_, i) => i + 1);
      expect(lineNumbers).toEqual(expected);
    });

    it("line units add up to 15", () => {
      const total = rules.lines.reduce((sum, l) => sum + l.units, 0);
      expect(total).toBeCloseTo(15, 4);
    });

    it("every line has a section, name, units, and filter", () => {
      for (const line of rules.lines) {
        expect(line).toHaveProperty("line");
        expect(line).toHaveProperty("section");
        expect(line).toHaveProperty("name");
        expect(line).toHaveProperty("units");
        expect(line).toHaveProperty("filter");
        expect(line.units).toBeGreaterThan(0);
      }
    });

    it("every line references a valid section", () => {
      const sectionIds = new Set(rules.sections.map((s) => s.id));
      for (const line of rules.lines) {
        expect(sectionIds.has(line.section)).toBe(true);
      }
    });
  });

  describe("sections", () => {
    it("has 8 sections", () => {
      expect(rules.sections).toHaveLength(8);
    });

    it("section minUnits add up to 15", () => {
      const total = rules.sections.reduce((sum, s) => sum + s.minUnits, 0);
      expect(total).toBeCloseTo(15, 4);
    });

    it("each section's lines match the count of lines referencing it", () => {
      for (const section of rules.sections) {
        const linesInSection = rules.lines.filter(
          (l) => l.section === section.id,
        );
        expect(section.lines).toHaveLength(linesInSection.length);
        expect(section.lines).toEqual(linesInSection.map((l) => l.line));
      }
    });

    it("section line units match the section minUnits", () => {
      for (const section of rules.sections) {
        const sectionLineUnits = rules.lines
          .filter((l) => l.section === section.id)
          .reduce((sum, l) => sum + l.units, 0);
        expect(sectionLineUnits).toBeCloseTo(section.minUnits, 4);
      }
    });

    it("free electives section has creditPool and poolCredits", () => {
      const fe = rules.sections.find((s) => s.id === "free-electives");
      expect(fe).toBeDefined();
      expect(fe!.creditPool).toBe(true);
      expect(fe!.poolCredits).toBe(9);
    });
  });

  describe("HUA lines 1-6", () => {
    it("lines 1-5 accept HUA subjects", () => {
      for (let i = 0; i < 5; i++) {
        expect(rules.lines[i].filter.type).toBe("subjects");
      }
    });

    it("line 6 is HU 3900 or HU 3910", () => {
      const line6 = rules.lines[5];
      expect(line6.line).toBe(6);
      expect(line6.filter.type).toBe("courses");
      expect((line6.filter as { courses: string[] }).courses).toEqual([
        "HU 3900",
        "HU 3910",
      ]);
    });
  });

  describe("WPE line 7", () => {
    it("has 4 sub-slots of 1/12 each", () => {
      const line7 = rules.lines[6];
      expect(line7.line).toBe(7);
      expect((line7 as { subSlots: number }).subSlots).toBe(4);
      expect((line7 as { subSlotUnits: number }).subSlotUnits).toBeCloseTo(
        1 / 12,
        4,
      );
    });
  });

  describe("Social Science lines 8-9", () => {
    it("accepts the correct social science subjects and ID 2050", () => {
      const expectedSubjects = [
        "ECON",
        "ENV",
        "GOV",
        "PSY",
        "SD",
        "SOC",
        "SS",
        "STS",
        "DEV",
      ];
      for (const line of [rules.lines[7], rules.lines[8]]) {
        const filter = line.filter as {
          subjects: string[];
          additionalCourses: string[];
        };
        expect(filter.subjects).toEqual(expectedSubjects);
        expect(filter.additionalCourses).toEqual(["ID 2050"]);
      }
    });
  });

  describe("IQP lines 10-12", () => {
    it("are manual", () => {
      for (let i = 9; i < 12; i++) {
        expect(rules.lines[i].filter.type).toBe("manual");
      }
    });
  });

  describe("Free Electives lines 13-15", () => {
    it("accept any course", () => {
      for (let i = 12; i < 15; i++) {
        expect(rules.lines[i].filter.type).toBe("any");
      }
    });
  });

  describe("Computer Science lines 16-33", () => {
    it("line 16 accepts CS 1101/1102 or CS 2000+", () => {
      const line16 = rules.lines[15];
      expect(line16.filter.type).toBe("subjectMinLevel");
      const filter = line16.filter;
      expect(filter.additionalCourses).toEqual(["CS 1101", "CS 1102"]);
      expect(filter.minLevel).toBe(2000);
    });

    it("lines 17-25 require CS 2000+", () => {
      for (let i = 16; i < 25; i++) {
        const filter = rules.lines[i].filter as {
          type: string;
          subject: string;
          minLevel: number;
        };
        expect(filter.type).toBe("subjectMinLevel");
        expect(filter.subject).toBe("CS");
        expect(filter.minLevel).toBe(2000);
      }
    });

    it("lines 22-25 have area tags", () => {
      const areaTags = [21, 22, 23, 24].map(
        (i) => (rules.lines[i] as { areaTag: string }).areaTag,
      );
      expect(areaTags).toEqual(["systems", "theory", "design", "social"]);
    });

    it("lines 26-30 require CS 4000+", () => {
      for (let i = 25; i < 30; i++) {
        expect(rules.lines[i].filter.type).toBe("subjectMinLevel");
      }
    });

    it("lines 31-33 are MQP (manual)", () => {
      for (let i = 30; i < 33; i++) {
        expect(rules.lines[i].filter.type).toBe("manual");
        expect(rules.lines[i].name).toBe("MQP");
      }
    });
  });

  describe("Mathematics lines 34-40", () => {
    it("lines 34-37 require MA 1000+", () => {
      for (let i = 33; i < 37; i++) {
        const filter = rules.lines[i].filter as {
          subject: string;
          minLevel: number;
        };
        expect(filter.subject).toBe("MA");
        expect(filter.minLevel).toBe(1000);
      }
    });

    it("line 38 requires MA 2000+", () => {
      const filter = rules.lines[37].filter as {
        subject: string;
        minLevel: number;
      };
      expect(filter.subject).toBe("MA");
      expect(filter.minLevel).toBe(2000);
    });

    it("line 39 is MA 2621 or MA 2631 (Probability)", () => {
      const line39 = rules.lines[38];
      expect(line39.name).toBe("Probability");
      expect((line39.filter as { courses: string[] }).courses).toEqual([
        "MA 2621",
        "MA 2631",
      ]);
    });

    it("line 40 is MA 2611 or MA 2612 (Statistics)", () => {
      const line40 = rules.lines[39];
      expect(line40.name).toBe("Statistics");
      expect((line40.filter as { courses: string[] }).courses).toEqual([
        "MA 2611",
        "MA 2612",
      ]);
    });
  });

  describe("Science lines 41-45", () => {
    it("lines 41-43 accept BB, CH, GE, PH only", () => {
      for (let i = 40; i < 43; i++) {
        const filter = rules.lines[i].filter as { subjects: string[] };
        expect(filter.subjects).toEqual(["BB", "CH", "GE", "PH"]);
      }
    });

    it("lines 44-45 accept Note 4 disciplines except RBE 3100 and BME 1004", () => {
      for (let i = 43; i < 45; i++) {
        const filter = rules.lines[i].filter as {
          subjects: string[];
          excludedCourses: string[];
        };
        expect(filter.subjects).toEqual([
          "AE",
          "BB",
          "BME",
          "CE",
          "CH",
          "CHE",
          "ECE",
          "ES",
          "GE",
          "ME",
          "PH",
          "RBE",
        ]);
        expect(filter.excludedCourses).toEqual(["RBE 3100", "BME 1004"]);
      }
    });
  });

  describe("exclusions", () => {
    it("excludes CS 2119 from CS requirement", () => {
      const cs2119 = rules.exclusions.find((e) => e.course === "CS 2119");
      expect(cs2119).toBeDefined();
    });

    it("excludes CS 5007 from 4000+ requirement", () => {
      const cs5007 = rules.exclusions.find((e) => e.course === "CS 5007");
      expect(cs5007).toBeDefined();
    });
  });

  describe("only-one-of sets", () => {
    it("has 3 sets", () => {
      expect(rules.onlyOneSets).toHaveLength(3);
    });

    it("CS 1101/1102 set", () => {
      const set = rules.onlyOneSets.find((s) => s.id === "cs-intro");
      expect(set).toBeDefined();
      expect(set!.courses).toEqual(["CS 1101", "CS 1102"]);
    });

    it("CS 2301/2303 set", () => {
      const set = rules.onlyOneSets.find(
        (s) => s.id === "cs-systems-programming",
      );
      expect(set).toBeDefined();
      expect(set!.courses).toEqual(["CS 2301", "CS 2303"]);
    });

    it("CS 2102/210X/2103 set", () => {
      const set = rules.onlyOneSets.find((s) => s.id === "cs-ood");
      expect(set).toBeDefined();
      expect(set!.courses).toEqual(["CS 2102", "CS 210X", "CS 2103"]);
    });
  });

  describe("cross-lists", () => {
    it("includes CS 2022 / MA 2201", () => {
      const found = rules.crossLists.some(
        (pair) => pair.includes("CS 2022") && pair.includes("MA 2201"),
      );
      expect(found).toBe(true);
    });

    it("includes CS 4032 / MA 3257", () => {
      const found = rules.crossLists.some(
        (pair) => pair.includes("CS 4032") && pair.includes("MA 3257"),
      );
      expect(found).toBe(true);
    });

    it("includes CS 4033 / MA 3457", () => {
      const found = rules.crossLists.some(
        (pair) => pair.includes("CS 4033") && pair.includes("MA 3457"),
      );
      expect(found).toBe(true);
    });

    it("includes GOV 2314 / ID 2314", () => {
      const found = rules.crossLists.some(
        (pair) => pair.includes("GOV 2314") && pair.includes("ID 2314"),
      );
      expect(found).toBe(true);
    });

    it("every pair has exactly 2 entries", () => {
      for (const pair of rules.crossLists) {
        expect(pair).toHaveLength(2);
      }
    });
  });

  describe("checks", () => {
    it("has 4 CS area checks", () => {
      const areaChecks = rules.checks.filter((c) => c.type === "area");
      expect(areaChecks).toHaveLength(4);
      const ids = areaChecks.map((c) => c.id);
      expect(ids).toEqual(
        expect.arrayContaining(["systems", "theory", "design", "social"]),
      );
    });

    it("systems area lists the right courses", () => {
      const systems = rules.checks.find((c) => c.id === "systems")!;
      expect(systems.courses).toEqual([
        "CS 3013",
        "CS 4513",
        "CS 4515",
        "CS 4516",
        "CS 502",
        "CS 533",
        "CS 535",
      ]);
    });

    it("social implications includes non-CS courses", () => {
      const social = rules.checks.find((c) => c.id === "social")!;
      expect(social.externalCourses).toBeDefined();
      expect(social.externalCourses).toEqual(
        expect.arrayContaining([
          "GOV 2314",
          "GOV 2315",
          "IMGD 2000",
          "RBE 3100",
        ]),
      );
    });

    it("has a science depth check", () => {
      const scienceDepth = rules.checks.find(
        (c) => c.id === "science-depth",
      )!;
      expect(scienceDepth.displayCourses).toBe(3);
      expect(scienceDepth.minFromOneDiscipline).toBe(2);
    });

    it("has HUA depth, breadth, and AP/IB limit checks", () => {
      expect(rules.checks.find((c) => c.id === "hua-depth")).toBeDefined();
      expect(rules.checks.find((c) => c.id === "hua-breadth")).toBeDefined();
      expect(
        rules.checks.find((c) => c.id === "hua-ap-ib-limit"),
      ).toBeDefined();
    });

    it("HUA breadth has 5 groupings with all-language exception", () => {
      const breadth = rules.checks.find((c) => c.id === "hua-breadth")!;
      const groupings = breadth.groupings as Record<string, string[]>;
      expect(Object.keys(groupings)).toHaveLength(5);
      expect(breadth.allLanguageException).toBe(true);
    });

    it("has residency and MA 1000-level limit checks", () => {
      expect(rules.checks.find((c) => c.id === "residency")).toBeDefined();
      expect(
        rules.checks.find((c) => c.id === "ma-1000-limit"),
      ).toBeDefined();
    });

    it("has graduate equivalence check", () => {
      expect(
        rules.checks.find((c) => c.id === "grad-equivalence"),
      ).toBeDefined();
    });
  });

  describe("manual items", () => {
    it("has 3 IQP and 3 MQP checkboxes", () => {
      const iqps = rules.manualItems.filter((m) => m.id.startsWith("iqp"));
      const mqps = rules.manualItems.filter((m) => m.id.startsWith("mqp"));
      expect(iqps).toHaveLength(3);
      expect(mqps).toHaveLength(3);
    });

    it("has WPE sports checkbox", () => {
      expect(
        rules.manualItems.find((m) => m.id === "wpe-sports"),
      ).toBeDefined();
    });

    it("has depth confirmation checkbox", () => {
      expect(
        rules.manualItems.find((m) => m.id === "hua-depth-confirmation"),
      ).toBeDefined();
    });
  });

  describe("HUA subjects", () => {
    it("lists all 15 HUA subjects from the sheet's 5 groupings", () => {
      expect(rules.huaSubjects).toHaveLength(15);
      expect(rules.huaSubjects).toEqual(
        expect.arrayContaining([
          "AR",
          "TH",
          "MU",
          "AB",
          "CN",
          "ISE",
          "GN",
          "SP",
          "EN",
          "WR",
          "HI",
          "HU",
          "INTL",
          "PY",
          "RE",
        ]),
      );
    });
  });
});
