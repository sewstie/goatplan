# Dark theme release checks

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

Screenshots are in `apps/web/e2e/screenshots/theme-release-*.png`. They include
both themes for all three widths. Ticket 10's `theme-*.png` captures also cover
drawing mode, blocked-time hatching and keyboard focus.

Five older browser failures reproduce before ticket 11: four checks still
look for planner actions in the removed `main header`, and the long
registration-list check expects no nested scrolling at tablet width. These
are in `plans.spec.ts` and `saved-view.spec.ts`. They are not regressions
introduced by the theme controls.

## Release gate

My degree is already available to invited testers. Ticket 12 must finish its
degree controls, tokens and review before both features are released
together. The user assigned degree files to the other session. Ticket 11
does not open degree access or bypass that gate. The final combined checkout
needs frontend and relevant browser checks after integration. Workday
verification of the five-major launch is a separate release gate.
