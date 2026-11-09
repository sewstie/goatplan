# Historical dark-theme release checks

This is historical evidence for the implementation snapshot identified below.
Its test counts, known failures and release-gate plans are not current status.
My degree is now directly accessible and all five Class of 2030 sheets are
selectable, with beta registry metadata and no recorded student verification.
Use [current project checks](launch-check.md), [theme behavior](degree-dark-theme.md)
and [development](development.md) for the present code and verification commands.
The remaining sections retain the original validation record.

Ticket 11 adds the global theme control to saved plans and registration on
desktop and phone. Sharing uses dark field and border tokens. Light token
values stay unchanged.

The release checks use the production app, frozen course data and downloaded
files. They cover planner, saved plans, shared schedules, registration,
sharing, calendar export, guide, feedback and rename dialogs in both themes
at 1440, 834 and 375 px. Print uses Light and restores the screen preference
afterwards. Shared URLs, calendar files and history backups are identical
across themes, including history courses, confirmations and pins.

## Validation

The checked snapshot contains commit `2d51ae9`, ticket 10's working changes
and ticket 11. It was built in `/tmp/goatplan-ticket11-checkout` because other
sessions were changing the degree engine and degree theme in the shared
checkout. This evidence does not validate those unfinished changes.

- Production build and lint passed.
- All 1,643 Vitest tests passed, including share-field text and control contrast.
- All 52 theme, shell, sharing, calendar and print browser checks passed.
- Nine additional saved-plan and registration checks passed.
- The ui_reviewer found no blocking issues across both themes and all three
  widths. Labels, keyboard support, focus and Light print output passed review.
- Light planner captures at 1440 and 834 px differed only by one RGB level on
  61 and 19 pixels respectively, consistent with rasterization noise.

Five older browser failures reproduced before ticket 11: four checks still
look for planner actions in the removed `main header`, and the long
registration-list check expects no nested scrolling at tablet width. These
are in `plans.spec.ts` and `saved-view.spec.ts`. They are not regressions
introduced by the theme controls.

## Release gate

Ticket 12 completes the degree controls, tokens and UI review required to
expose degree support and Dark together. The combined checkout passed lint,
the production build, 1,660 Vitest tests and 73 degree, history, badge and
global theme browser checks. See [degree theme checks](degree-dark-theme.md).
At that snapshot, My degree was available to invited testers and Workday
verification was a separate release task. No public deployment was made by that
validation. Current direct access is described in [major selection](degree-major-selection.md).
