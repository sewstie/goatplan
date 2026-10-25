# UI copy reference

Wording used in the app, grouped by feature. Each entry shows the rule and an example.

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
