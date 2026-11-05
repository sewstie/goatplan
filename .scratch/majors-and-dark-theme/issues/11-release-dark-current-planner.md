# 11: Release dark theme across current planner views

Ticket: 11

Wave: 3

Status: BLOCKED

Blocked By: 12 (release gate; planner implementation is verified)

Triage: ready-for-agent

## What to build

Students can use the same remembered theme across saved plans, shared schedules, registration, menus and phone views, while printed and exported output stays independent of it.

## Acceptance criteria

- [x] Verify saved plans, shared schedules, Sections to register, popovers, guide, toasts and phone views in both themes.
- [x] Keep the theme control available on shared phone views and preserve the viewer's choice across navigation.
- [x] Always print in light colors; shared links, history/plan exports and calendar files contain no theme-dependent academic data.
- [x] Check WCAG text and meaningful-control contrast and review screenshots at 1440px, 834px and 375px with unchanged light baselines.
- [x] Pass frontend and relevant browser checks and obtain no blocking UI review findings; ship independently of degree verification.
- [ ] If My degree is exposed when theme ships, complete degree theme integration before exposing both together; an absent degree feature does not block theme release.

## Blocked by

- 10 is implemented in the existing working changes.
- 12 gates release because restored My degree is available to invited testers.
  The user confirmed another session owns degree files. Complete its
  integration and combined checks before exposing both features together.

## Implementation and checks

Saved plans and registration now offer the global theme button on desktop
and the existing menu switch on phone. Dark share fields and boundaries use
readable semantic tokens. TDD first reproduced both missing controls and
the share-field contrast failure, then verified each fix.

An isolated snapshot of the restored degree baseline, ticket 10 and ticket
11 passed production build, lint, 1,643 Vitest tests and 52 theme/shell/share/
calendar/print browser checks. Nine additional saved and registration checks
passed. Shared URLs, calendar downloads and history backups are identical in
both themes. Print stays Light. Screenshots cover both themes at 1440, 834
and 375 px. Light planner images are unchanged apart from one RGB level on
a few edge pixels.

The ui_reviewer found no blocking issues after reviewing both themes at all
three widths, including saved plans, registration, sharing, dialogs, guide,
toasts and Light print output. The final six ticket 11 acceptance checks also
passed after removing an assertion tied to the share field's markup.

Five older header and long-list browser failures also reproduce before this
ticket. The in-progress sheet-engine changes in the shared checkout were
excluded from the isolated snapshot. See `docs/dark-theme-release.md` for
the scope of this evidence. No public release has been performed.

## Ownership and checks

Theme and lead integration owns this slice. Shared changes remain lead-owned. Coordinate new shared rule types through the lead; if a new rule becomes a prerequisite for another ticket, record that actual blocking edge before execution. Keep tests at the existing production-app, public degree-source and audit boundaries where applicable. Every code slice needs appropriate logic and browser checks, passing lint/tests/build, and no blocking UI review findings for changed screens.

The user approved this ticket and its testing boundaries. This is an approved local ticket; no external tracker issue has been created.
