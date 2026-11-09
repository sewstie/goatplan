# Course maps

CS, RBE, ME, ECE and Data Science use the same map, list, course details
and planning controls. The Course map tab is enabled for the registered sheets
at `/degree`; the separate individual Suggestions feature flag does not control it.
Changing majors clears the selected course. Taken and planned markers use
saved history, including cross-listed codes. Changing a planned course’s
term updates its saved code.

RBE shows all 13 courses listed in the
[2026–27 WPI catalog](https://wpi.cleancatalog.net/robotics-engineering).
Colors group topics, not degree requirements. Background from other
departments appears on cards and in the course details.

Each RBE background summary links to its catalog entry. The RBE 3001 entry
prints “BE 2002”; the map interprets this as RBE 2002 and says so in the
summary. The map keeps ECE 2049 wherever the catalog names it. It does not
replace it with RBE 2020 or infer arrows from course sequence numbers.

The degree sheet still controls which courses count toward graduation.
Map arrows show recommended background, not enforced prerequisites.

## Other majors

ME shows 41 courses, including its engineering science foundations. ECE
shows 34 courses. Data Science shows 27 courses, including computing,
linear algebra, statistics and probability foundations.

The maps use the 2026–27 catalog pages for
[ME](https://wpi.cleancatalog.net/mechanical-and-materials-engineering),
[ECE](https://wpi.cleancatalog.net/electrical-and-computer-engineering) and
[Data Science](https://wpi.cleancatalog.net/data-science).
Graduate courses and unnumbered special topics are not shown.
Each course links to its catalog entry.

Supporting subjects shown on a map have arrows. Background outside the
map stays on the cards. Cross-listed courses share one card.

ECE 2799 recommends at least three of four courses. ME 4512 recommends
both ES 2501 and ES 2502, or both CE 2000 and CE 2001. These conditions
appear in the details and list without arrows that could imply one course
is enough. Concurrent background stays marked as concurrent.

ME 4506 prints MA 2501 for differential equations. The map preserves that
code and flags it in the summary.

The map tests cover every registered major, course aliases, key chains,
numbered bands and arrows avoiding course cards. Browser tests cover
major switching, planning, keyboard selection and light/dark screenshots
at 1440 and 834 px.

## Maintenance

`lib/courseMap/maps.ts` maps sheet IDs to curated records and layouts. Each
major has a background JSON file and a layout module. Counts above describe
those curated sets, not every course in the persistent catalog. Update the
records, structured expressions and routing tests together when the catalog
changes. A source-review date records a past check, not continuous verification.

Map planning changes degree history through explicit actions. It does not
initialize or synchronize the schedule planner. Academic requirements continue
to come from the selected effective tracking sheet.
