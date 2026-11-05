# 13: Explore CS course background in a map and list

Ticket: 13  
Wave: 5  
Status: COMPLETE  
Blocked By: 04  
Triage: ready-for-agent

## What to build

Students can explore CS courses and connected background courses in course-number bands, select a node for source details and use an equivalent keyboard-accessible list.

## Acceptance criteria

- [x] Inspect the supplied WPI flowchart before implementing its visual direction; verify relationships against official sources for the supported curriculum.
- [x] Curate relationships from relevant background wording, preserving AND/OR alternatives, equivalent experience and instructor approval with source URLs.
- [x] Distinguish recommended background from prerequisites; make no readiness or eligibility claims and do not auto-confirm degree requirements.
- [x] Show 1000–4000 course-number bands with same-band and reverse-band connections, including nodes missing offering details and a clear explanation.
- [x] Selecting a node highlights incoming/outgoing connections and opens details with source wording; provide keyboard navigation and an equivalent list.
- [x] Use TypeScript and existing semantic tokens and course details; verify relationship results and desktop/tablet interaction through existing public seams.
- [x] Treat this as the first complete course-map slice, not the completed five-major map release.

## Blocked by

- 04: Choose a major without losing sheet state

## Ownership and checks

Course map and CS sources owns this slice. Shared changes remain lead-owned. Coordinate new shared rule types through the lead; if a new rule becomes a prerequisite for another ticket, record that actual blocking edge before execution. Keep tests at the existing production-app, public degree-source and audit boundaries where applicable. Every code slice needs appropriate logic and browser checks, passing lint/tests/build, and no blocking UI review findings for changed screens.

The user approved this ticket and its testing boundaries. This is an approved local ticket; no external tracker issue has been created.

## Completion

Implemented in the CS My degree view behind its existing invitation. The map covers 52 CS catalog entries and their connected background courses. Relationship notes, source wording, cross-list offering lookup and missing offering explanations remain in TypeScript. Other majors and elective groups remain separate follow-ups.

Used the approved public relationship output and production-app seams. Each behavior slice was verified red before green. Review found a CS 4300 interpretation issue and a related-course focus issue; both received failing regression tests before fixes.

Final checks passed: lint, 162 Vitest files with 1,681 tests, the standard production build, six map browser checks and the preceding 39-check map/degree regression run. Desktop/tablet screenshots cover 1440px and 834px in Light and Dark. The ui_reviewer found no blocking issues and independently checked the updated screenshots, build and keyboard focus. Design PNGs are absent from this checkout; comparison used the supplied WPI flowchart and existing GoatPlan styling.

Source decisions and scope are recorded in docs/cs-course-map.md. No five-major map release was performed.
