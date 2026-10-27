# UI copy reference

Wording used in the app, grouped by feature. Each entry shows the rule and an example.

## Sort descriptions

The Sort menu shows six presets. Each has a label (the accessible name) and a short description.

| Preset | Label | Description |
|---|---|---|
| Best overall | Best overall | A balance of start time, gaps and days |
| Fewest early classes | Fewest early classes | Fewer classes before 10 AM |
| Latest start | Latest start | Classes start as late as possible each day |
| Earliest finish | Earliest finish | Classes end as early as possible each day |
| Most days off | Most days off | Fewer days on campus |
| Most compact | Most compact | Less free time between classes |

**Latest start** and **Earliest finish** were added in ticket 05. Their descriptions are:

- Latest start: "Classes start as late as possible each day"
- Earliest finish: "Classes end as early as possible each day"

## Schedule badges – free time between classes

The badge reads `score.freeMinutes`, the same value "Most compact" sorts by. When `freeMinutes` is missing (a plan saved before the engine sent it), it is worked out from the meetings: sum every same-day gap longer than 10 minutes, treating overlapping meetings as one stretch.

| freeMinutes | Badge text |
|---|---|
| 0 | No gaps between classes |
| 1–59 | {n} min free between classes |
| 60 or more (rounded to nearest 30 min) | {h} h free between classes |

Examples:

- 0 → "No gaps between classes"
- 40 → "40 min free between classes"
- 60 → "1 h free between classes"
- 75 → "1.5 h free between classes"
- 150 → "2.5 h free between classes"
- 180 → "3 h free between classes"

The old 30-minute gap count badge ("No gaps", "2 gaps") is removed. The free-time badge keeps its place in the badge order and its pill look.
