# Diagnosis copy

Labels used in the "Ways to fix it" section when no schedule fits.

## Fix labels

| Fix kind | Condition | Label |
|---|---|---|
| `relaxStartsAfter` | `startsAfter > 0` | Change to {time} |
| `relaxStartsAfter` | `startsAfter === 0` | Clear start restriction |
| `clearBlocked` | | Clear blocked times |
| `allowFull` | | Show full sections |
| `clearAnyOf` | no `startsAfter` | Allow any professor for {course} |
| `clearAnyOf` | `startsAfter > 0` | Allow any professor for {course} and change to {time} |
| `clearAnyOf` | `startsAfter === 0` | Allow any professor for {course} and clear start restriction |
| `unlock` | single lock | Unlock {section code} |
| `unlock` | multiple locks | Unlock {course} |
| `dropCourse` | | Remove {course} |

Times use the same `formatTime` format as the start-time preference: "9:00 AM", "11:00 AM", "12:00 PM".

## Count line

Each fix button shows a schedule count below its label:

- **Exact:** "{n} schedule fits" / "{n} schedules fit"
- **Capped (lower bound):** "At least {n} schedules fit"
