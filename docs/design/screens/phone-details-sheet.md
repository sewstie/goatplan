# Phone · 375 px · Details bottom sheet

Course details open in a bottom sheet instead of the side panel. This is the
phone replacement for the 284 px `DetailsPanel`.

- Width: 375 px · Breakpoint: below 40 rem (640 px)

## Sheet properties

```
Sheet side="bottom"
├── max-height    85 dvh
├── width         100%
├── border-radius rounded-t-panel (top corners only)
├── padding       pb safe-area-inset-bottom (≥ 20 px)
├── transition    slide up from translate-y-full
├── backdrop      scrim overlay
└── focus         trapped inside; heading receives initial focus
```

## Content

Same `CourseDetailsPanel` as desktop:
- Course title and code
- Lecture professor filter (when the course has lectures)
- "Sections in this schedule" with Lock/Unlock controls
- Diagnosis ("Needs attention") and one-click fixes
- "Choose a lab/discussion" links

## Behavior

- Opens only on a deliberate tap: a class block in the day view, a course
  row in "Your courses", or a search result. Never opens because
  `selectedCourse` changed on its own (e.g. after removing the last course).
- Closing (Escape, Close button, tap outside) keeps the course and section
  selected — selection state is independent of sheet visibility.
- Open state lives in `PlannerShell` (React state), not the planner store.
- The `PhoneDetailsProvider` / `useOpenPhoneDetails` context distributes the
  open callback to child components without prop drilling.

## "Block a time" sheet

On phone, the "Block a time" button in preferences also opens a bottom
`Sheet` instead of the centered `Dialog` used on tablet. Same form content,
same full-width styling.
