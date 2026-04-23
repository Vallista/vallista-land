# CLAUDE.md — vallista-land

**Read `docs/00-README.md` before you touch any code.** It tells you what's been decided, what's out of scope, and the order to build things.

## Hard rules

1. **Tokens are the one source of truth.** `docs/tokens.json` (machine-readable) + `docs/theme.css.ts` (vanilla-extract). Any color, spacing, radius, elevation, or duration used in code **must** come from a semantic token (`vars.color.*`, `vars.space.*`, etc). Raw hex / raw px in component CSS = review rejection.

2. **No client JS by default.** This is Astro-first. Every `<Component client:*>` needs a written justification in a comment. The only pre-approved client island is `src/components/search/Palette.tsx`.

3. **No icon libraries. No UI libraries. No CSS-in-JS at runtime.** Inline SVG (1.4 stroke, 16px box) copied from the design system reference. vanilla-extract compiles to static CSS.

4. **One accent color.** Blue. If you're reaching for a second hue, step back and use the type scale or spacing instead.

5. **Korean typography rules are load-bearing.** `word-break: keep-all` on `<body>`. `text-wrap: pretty` where supported. Never `break-all`. Never `text-align: justify`. Ragged-right is correct.

6. **Focus-visible on every interactive element.** Never `:focus` alone, never `outline: none` without a replacement. `box-shadow: vars.focusRing`.

7. **Dark mode is auto + explicit.** `prefers-color-scheme` sets the default; `localStorage.theme` overrides. Don't special-case dark inside components — add a semantic token instead.

8. **`prefers-reduced-motion: reduce` collapses all durations to 0.01ms.** Required in the global stylesheet. Never skip.

9. **Match the references.** `design-system/Design System.html` is the visual source of truth for tokens + components. `blog/Blog A.html` is the visual target for the blog itself. When they disagree with docs, docs win on API, references win on visuals.

10. **Strict TypeScript.** `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. No `as Foo`. No implicit any. Props are exhaustively typed.

## Folder conventions

- `src/styles/theme.css.ts` — paste from `docs/theme.css.ts`
- `src/components/ui/` — primitives (`04-components/*.md`)
- `src/components/blog/` — blog-specific composites
- `src/components/search/Palette.tsx` — the only client island
- `src/content/articles/*.mdx` — articles
- `src/content/notes/*.md` — notes (≤ 280 chars, single paragraph)
- `src/content/projects/*.yaml` — projects

## Build / check commands

```sh
pnpm dev           # astro dev
pnpm build         # astro build && pagefind --site dist
pnpm check         # astro check && biome check . && tsc --noEmit
pnpm test          # vitest
pnpm test:e2e      # playwright (smoke only)
pnpm lighthouse    # lhci autorun (must hit ≥95 perf)
```

Run `pnpm check` before every commit. CI blocks on it.

## Definition of "done"

See `docs/08-definition-of-done.md`. Performance ≥ 95, WCAG 2.1 AA, all routes render, dark mode works in both auto and manual, reduced-motion honored.

## Out of scope (don't build)

Comments, reactions, view counts, analytics tracking, i18n, admin/editor UI, image pipeline, multi-color theming. Ask before adding anything not in `05-blog-spec.md § Routes`.
