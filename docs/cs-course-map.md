# CS course map

The Course map tab on My degree shows how CS courses build on each other, from CS 1101/1102 at the top to 4000-level electives at the bottom. It follows the layout of the [WPI CS Major Flowchart](https://wpi.cleancatalog.net/sites/default/files/2025-05/CS%20Major%20Flowchart.png): course-number bands from top to bottom, topic columns (networks and systems on the left, design and data in the middle, theory on the right), area colors, and "or" groups.

## Where the data comes from

- `apps/web/src/lib/courseMap/cs-background.json` holds the "Recommended background" text from each course page of the [2026–27 CS catalog](https://wpi.cleancatalog.net/computer-science), with a structured version of it. It was checked against the live catalog on 2026-11-07, and nothing had changed.
- `apps/web/src/lib/courseMap/csLayout.ts` places each course in a grid cell, lists the interchangeable pairs (1101/1102, 2102/2103, 2303/2301) and tags the four required areas and the Cybersecurity concentration. The area lists come from the catalog's CS major and Cybersecurity concentration pages.
- CS 1004, CS 1005 and CS 2119 are not placed because they don't count toward the CS major. The page footer names them.

## How arrows are made

`flowchart.ts` turns each background statement into arrows:

- A pair that appears as a choice ("CS 1101 or CS 1102") sends one arrow from the pair.
- Other choices between several CS courses become dashed arrows ("one of several options").
- Courses outside CS (MA, ECE, IMGD, DS) are written on the card instead of drawn.
- Notes such as "substantial prior programming experience" and suggested background don't create arrows.
- An arrow is dropped when a longer chain of required arrows already connects the two courses. A dashed arrow never counts as part of such a chain. The details panel and the list still show every course that the catalog names.

`routing.ts` draws the arrows. Lines run only in the gaps between cards. They leave a course from its bottom and enter the next row from the top, or travel down a column gap and enter from the side. Each course gets its own lane in each gap, so lines from different courses never run on top of each other. Tests check that no line crosses a card or an "or" badge, and that no arrow points up.

## Using it

Selecting a course highlights every course before it and after it, and dims the rest. Hovering previews the same thing. The details bar above the map shows direct background, what it leads to, the catalog wording and a source link, plus Plan this. The map fits the width by default. Ctrl + scroll or a pinch zooms around the cursor, dragging moves the map, and on a focused map +, - and 0 zoom in, zoom out and fit. List view shows the same information by level. Escape clears the selection.

These are WPI's recommendations, not enforced prerequisites. The map doesn't decide readiness or change degree requirements.

The tab is behind `COURSE_MAP_ON` in `apps/web/src/components/degree/degreeFeatures.ts`.
