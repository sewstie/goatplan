# CS course background map

The first map covers undergraduate CS courses in the 2026–27 WPI catalog. Open My degree with the existing invitation, choose Computer Science, and select Course map. Other majors and expandable elective groups belong to later tickets.

The visual reference is the [WPI CS Major Flowchart](https://wpi.cleancatalog.net/sites/default/files/2025-05/CS%20Major%20Flowchart.png). Its horizontal course-number bands and selectable connections inform the map. The reference was inspected during implementation. Its May 2025 publication path does not establish current academic relationships.

Relationships come from the [2026–27 CS catalog](https://wpi.cleancatalog.net/computer-science). Each curated entry stores its course URL, original background wording and a structured expression of course alternatives and experience notes. These are recommended backgrounds, not enforced prerequisites. Course-number bands are not academic years or terms. The map does not assess readiness, change history or confirm requirements.

Only relevant background statements create arrows. Credit exclusions, equivalent cross-list names, descriptive course mentions and suggested examples do not create extra requirements. Cross-listed names refer to one map node. Ambiguous wording, such as the and/or in CS 2303, stays visible in the source text and its note. No CS background statement in this catalog specifies instructor approval. The relationship output supports such notes and tests them with an explicitly synthetic source.

Connected courses outside CS remain visible even without offering data. Their own background has not been curated in this slice. The source link on those nodes identifies the CS statement that references them. Missing details never mean a course lacks background or will not be offered.

Map and list use the same public relationship output. Selecting a course shows incoming and outgoing connections, original wording and catalog source. Available descriptions come from the existing term catalog. The list retains the source wording and connection information. Both views use ordinary keyboard controls and the existing details sheet with Escape and focus restoration.

## Verification

The public relationship tests cover nested AND/OR choices, experience alternatives, same-band links, cross-listed offering lookup, absent offering data and a synthetic reverse-band connection with instructor approval. The production browser tests cover map/list selection, source text, preserved history, Escape focus restoration and following related courses with the keyboard.

Lint, all 1,681 Vitest tests and the standard production build pass. Six map browser checks pass at 1440px and 834px in both themes. The preceding map and degree regression run passed 39 checks. The UI reviewer found no blocking issues after the source interpretation, connection routing and keyboard fixes. Screenshots are saved under apps/web/e2e/screenshots/course-map-*.png.

The checkout has no design frame PNGs. Visual comparison used the supplied WPI flowchart and existing GoatPlan styling. Expandable elective groups and the remaining majors are separate tickets.
