# 01: Start new plans at Any time

## What to Build

A student opening a genuinely new plan sees Any time, no blocked time, and Only open sections enabled. Early schedules remain eligible until the student chooses a start-time restriction. Returning students retain their stored settings.

Parent: [00: First-visit tutorial and lecture professor selection](00-spec.md). Covers user stories 11–17 and the defaults portion of story 24.

## Blocked By

None.

## Status

Draft. Awaiting approval of the ticket breakdown.

## Scope and Ownership

The lead changes shared draft defaults, persistence behavior where needed, and the documented defaults. The preferences owner handles the visible preference controls. The plans owner participates only if saved-plan opening needs a correction. Follow the parent spec's shared-file ownership rules.

No prerequisite refactor or new schema is needed. Keep the current store actions and preference controls as the public interface.

## Acceptance Criteria

- [ ] A fresh draft displays Any time, has no blocked intervals, and has Only open sections enabled.
- [ ] With no start-time restriction, otherwise valid early classes appear in results. Published availability and the other explicit restrictions still apply.
- [ ] Choosing a start time or blocked interval updates results automatically and excludes schedules that violate it.
- [ ] Turning off Only open sections makes otherwise valid full sections eligible through the existing control.
- [ ] Reloading an existing draft or opening an existing saved plan retains its stored start time, blocked intervals, open-section setting, professor selection, and locks.
- [ ] A fresh draft for another term uses the new defaults. Saving or copying an existing plan retains its current settings.
- [ ] Document the new defaults in the design reference and frontend architecture notes through the lead. Existing 9 AM reference states are not treated as the fresh-plan target.

## Vitest Coverage

- Exercise draft creation and public store actions with the existing injected storage and engine fixtures. Verify that the generated request has no start restriction until the student sets one.
- Restore drafts with nondefault preferences and open stored plans. Assert the observable settings and requests remain unchanged.
- Keep stored-plan compatibility tests. Do not rewrite all fixtures that intentionally contain a 9 AM preference.

## Playwright Coverage

- Start with a clean browser and controlled term data containing an early open lecture and a later full lecture. Check the visible defaults and browse actual engine results.
- Set and clear a start-time restriction, add a blocked interval, and toggle Only open sections. Verify the displayed results respect each choice.
- Reload a configured draft and reopen a saved plan. Check the visible settings and selected sections rather than only inspecting browser storage.

## Completion Checks

Run lint, Vitest, build, and the relevant Playwright suites. Capture changed states at 1440 px and 834 px against the updated design references. The ui_reviewer agent must find no blocking issues.

Use existing tokens, DM Sans, labels, and keyboard behavior. Do not modify the engine, scripts, published course data, or published engine assets.
