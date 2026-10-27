# GoatPlan project rules

## Scope

Phone is in scope at 375 px. The app must work on three target widths:

| Width | Viewport | What it covers |
|---|---|---|
| 375 px | Phone (iPhone SE / small Android) | Single-column layout, day calendar, bottom sheets |
| 834 px | Tablet (iPad portrait) | Sidebar + calendar, side details panel |
| 1440 px | Desktop / laptop | Full three-column layout |

The phone breakpoint is `40 rem` (640 px). Below it the app renders the phone
shell; from 640 px up it matches the tablet/desktop Figma designs.

## Screenshots

Screenshots are taken at **375, 834 and 1440 px**:

- **834 and 1440 px** match the Figma design PNGs in `docs/design/screens/`.
- **375 px** has no Figma frame. The implementation, the spec (`issues/00-spec.md`)
  and the phone screen notes in `docs/design/screens/phone-*.md` are the
  reference until a Figma pass.

## Design rules

- Use Tailwind theme tokens and CSS variables only — no hex values in components.
- DM Sans font throughout.
- Keyboard navigation and ARIA labels on all interactive elements.
- Touch targets at least 44 × 44 px on phone.
- `min-w-0`, `overflow-hidden` and `truncate` / `break-words` to prevent
  horizontal scroll at 375 px.
- Colors, radii, shadows and sizes only from `app/globals.css` tokens.

## Module design

Few deep modules with small public interfaces. Domain logic, filtering and
formatting live in pure TypeScript with Vitest unit tests. Components are thin
wrappers that read from the Zustand store.

## Checks

From the repo root, before every commit:

```bash
npm run lint          # ESLint
npm run test          # Vitest (103 files, 900+ tests)
npm run build         # Next.js production build
npm run engine:test   # C++ engine (146 tests)
npm run engine:wasm:test  # WASM smoke / reproducibility
npm run data:test     # data script tests (116 tests)
```
