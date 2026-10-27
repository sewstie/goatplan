# Phone · 375 px · Sections to register

The `/plans` page on a phone. Each section becomes a card instead of a table
row. Corresponds to desktop state 22.

- Width: 375 px · Breakpoint: below 40 rem (640 px)

## Layout

```
375 × 812       single column, px 16, scheduleFit="content"
├── header        plan name + actions
├── disclosure    "Your courses (N)" — shows the plan's courses
├── PreferencesBar (read-only: shows the plan's preferences)
├── schedule area (flexible height, not fixed 630)
│   ├── action buttons   Copy · Print · Open Workday — full width, ≥ 44 px
│   └── section cards    one article per section
└── PlansPhoneFooter
```

## Section cards

Each section renders as an `<article>` card with label–value rows:

| Label | Value |
|---|---|
| Course | "CS 2022 — Discrete Mathematics" |
| Section | "CL01 Lecture" |
| CRN | "12345" |
| Days and time | "Mon, Wed, Fri · 10:00 AM – 10:50 AM" |
| Room | "Higgins Labs 230" |
| Instructor | "David Olinger" |

Cards stack vertically with standard gap.

## Action buttons

- **Copy sections** — copies a text summary to the clipboard.
- **Print** — opens the browser print dialog. Print output keeps the
  desktop table layout, not the card layout.
- **Open Workday** — links to the WPI Workday registration page.

All three are full-width buttons with at least 44 px height, placed above
the card list.

## Differences from desktop

- The registration table (`<table>`) is replaced by `RegistrationCardList`.
- `scheduleFit="content"` lets the main area grow (no fixed 630 px height).
- Action buttons move from inline to stacked full-width.
