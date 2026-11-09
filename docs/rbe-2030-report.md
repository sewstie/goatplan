# RBE Class of 2030

This is a requirement-source and interpretation record. The current registry
makes this sheet selectable at `/degree`, with beta status and no recorded
student Workday verification. Validation counts and implementation sequences
below describe the original feature snapshot, not the current test suite. See
[major selection](degree-major-selection.md) and [current project checks](launch-check.md)
for current access and verification behavior.


## Sources

Reviewed on November 5, 2026:

- [Official Class of 2030 tracking sheet](https://www.wpi.edu/sites/default/files/2026-05/RBE-2030_fillable.pdf), linked from WPI's program tracking sheets page.
- [Robotics Engineering major, 2026–27 catalog](https://wpi.cleancatalog.net/robotics-engineering/robotics-engineering-major).
- [WPI program tracking sheets](https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets).

The PDF identifies students entering academic year 2026–27. Its second page is
a planning template, not another set of requirements.

## Numbered requirements

| Lines | Requirement and treatment |
| --- | --- |
| 1–3 | Humanities depth. Three related courses in one grouping need explicit theme confirmation. |
| 4 | HU 3900 or HU 3910. This differs from CS's Inquiry line number. |
| 5 | Humanities breadth. The five official subject groupings and modern-language exception are represented in data. |
| 6 | Humanities elective. |
| 7 | Four WPE slots. Courses or explicit confirmations fill individual slots. The sports alternative needs student confirmation; it is never assumed. |
| 8–9 | Social science in ECON, ENV, GOV, PSY, SD, SOC, SS, STS, DEV, or ID 2050. |
| 10–12 | IQP. Three manual completion items. |
| 13–15 | Free electives. One shared nine-credit pool. |
| 16–19 | MA 1021, 1022, 1023, 1024. Other calculus sequences need advisor review. |
| 20 | MA 2051, differential equations. |
| 21 | MA 2071, linear algebra. |
| 22 | MA 2621 or MA 2631, probability. |
| 23–24 | Physics. PH 1110/1111 and PH 1120/1121 are recommendations, so the filters accept PH courses. |
| 25–26 | Other science in BB, CH, GE or PH. |
| 27 | Entrepreneurship. ETR courses or BUS 2001, subject to explicit approval review. |
| 28–32 | RBE 1001, 2001, 2002, 3001 and 3002. The sheet excludes RBE 2020, RBE 300X and RBE 3100 from this five-course group. |
| 33 | A CS course. CS 1005 and CS 1101/1102 are examples, not mandatory choices. |
| 34 | Object-oriented programming. The initial matching choices are CS 2102, CS 2103 and CS 2119; confirm approval. |
| 35 | Software engineering. CS 3733 or RBE 300X, with approval review for equivalents. |
| 36 | An ECE course. ECE 2010 is recommended. |
| 37 | Embedded systems. ECE 2049 or RBE 2020. |
| 38 | Statics. ES 2501 is the initial matching example; alternatives need review. |
| 39 | Classical controls. ES 3011, ME 3703, ECE 3012 or AE 2310 remain subject to confirmation because the sources differ. RBE 502 does not fill this line. |
| 40–42 | Three engineering science and design electives. Department matches are provisional; approval and two courses at 4000-level or higher require explicit confirmation. |
| 43 | Social implications: CS/SS 3043, GOV 2302, GOV/ID 2314 or RBE 3100. |
| 44–46 | MQP. Three manual completion items and a separate robotics capstone design check. |

The 46 numbered course equivalents total 46/3 units including WPE. The PDF's
minimum academic credit is 15 units; WPE is additional. The registry and
validator use the numbered total, including WPE, to avoid silently dropping
line 7.

## Interpretations and confirmation

Every interpretation has a visible entry under Requirement checks. Matching
courses cannot confirm these entries. The student must explicitly confirm them;
the choice is stored only for this sheet. Associated completed course tiles
stay To check until confirmation.

The data contains checks for math equivalents, robotics substitutions,
programming and engineering equivalents, classical controls, design elective
approval and level distribution, social overlap and total credit,
entrepreneurship approval, humanities sequence and level, and robotics
capstone design.

The PDF gives ME 3703 as a controls example, while the catalog gives AE 2310.
Both sources also give ES 3011 and ECE 3012. Both sets are offered for matching,
but the controls check stays unresolved until the student confirms the course.
The catalog explicitly rules out RBE 502 for classical controls.

The sheet allows an advanced RBE course to replace RBE 1001 for a student with
strong background, and allows equivalents, independent work, experimental
courses and graduate courses more generally. The app does not infer those
approvals. Unlisted equivalents leave the numbered requirement unresolved;
the student must review the substitution with their advisor. Confirming a
review check does not invent a course equivalency or fill an empty line.

The design elective filters accept engineering and CS departments as potential
matches, excluding the social implications courses RBE 3100 and CS/SS 3043.
This is a candidate set, not an approved elective list. The separate design
check must confirm all three choices and the advanced-course distribution.
The catalog's elective heading does not supply an exhaustive approved list.

GOV 2302 and GOV/ID 2314 can meet both social science and social implications.
Social science has matching priority. If shared credit is approved and line 43
is empty, its checkbox records that overlap. This fills the requirement without
copying the course or adding its credit again. The separate social overlap
check stays unresolved until the student confirms the allocation and minimum
15 academic units. Additional academic credit may be needed when a course is
shared. Neither CS/SS 3043 nor RBE 3100 gets that overlap automatically.

Humanities review also covers the required 2000-level depth course, completing
five HUA courses before Inquiry, and the modern-language exception. Automatic
grouping alone does not establish those facts. The AP/IB humanities limit is
one course. Residency remains a check because course codes cannot prove eight
units were completed at WPI.

Cross-lists use both codes from the major catalog: CS/MA 2022/2201,
4032/3257 and 4033/3457; CS/SS 3043; CS/IMGD 4300;
CS/DS 4343, 4344, 4345 and 4433; CS/ECE 4801/4802;
IMGD/CS 4100; GOV/ID 2314; BME/ECE 4011 and 4023;
and RBE/ME 4322. Shared engine rules count each cross-list once.
No CS-only exclusion or only-one set is inherited by RBE.

## Worked histories and checks

`data/fixtures/rbe-2030-mid.json` records 17 completed courses and two planned
courses. The exact core lines and each section's totals were worked from the
PDF. Projects, WPE and the interpretation checks remain unresolved.

`data/fixtures/rbe-2030-complete.json` fills every numbered requirement with
39 academic courses and six confirmed project equivalents, plus confirmed
WPE. The humanities theme is confirmed. Interpretation checks and residency
remain open. “Complete” describes the worked course history, not verified
graduation eligibility. Equivalent slots assert completion without depending
on which interchangeable slot receives a course.

Both fixtures run through EngineClient and WebAssembly. The same assertions
can run against the native CLI after building it:

```sh
npm run engine:test
GOATPLAN_NATIVE_CLI="$PWD/engine/build/goatplan_cli" npm run test -w web -- src/lib/engine/audit.integration.test.ts
npm run lint
npm run test
npm run build
PORT=3091 npm run test:e2e -w web -- degree-rbe.spec.ts degree-major.spec.ts degree-badges.spec.ts --project=production --workers=2
```

Browser coverage exercises major selection and sheet feedback, saved
confirmations, search badges, Take in C Term actions and planned courses.
It captures the RBE sheet and checks panel at 1440px and 834px.
All rules use existing generic filters, checks and manual items. A regression
test exposed an existing engine bug: confirming any manual check also confirmed
humanities depth. With the owner's explicit engine-boundary exception, the
engine now accepts depth confirmation only from the group-depth check.
Native and WebAssembly regressions cover the failure, and WASM was rebuilt
through the existing Emscripten wrapper.

The UI reviewer found no blocking issues at 1440px and 834px. Keyboard toggling,
visible focus, Escape dismissal and horizontal overflow were checked. The
design reference directory is absent in this checkout, so visual review used
the existing degree UI rather than unavailable design PNGs.
