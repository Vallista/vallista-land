# Components — index

Each primitive has its own `.md`. Ordered by dependency depth — build top-down.

| Doc                  | Lines | What it covers                         |
|----------------------|-------|----------------------------------------|
| `Button.md`          | 3 variants · 3 sizes · states + a11y   |
| `Chip.md`            | 5 tones · dot modifier                 |
| `Input.md`           | text · search · kbd hint               |
| `Card.md`            | post card · project card               |
| `Cover.md`           | 5 SVG patterns                         |
| `Callout.md`         | prose inset                            |
| `CodeBlock.md`       | tabs + Copy + Shiki build-time         |
| `NavRail.md`         | sidebar · aria-current                 |
| `Toc.md`             | floating right rail · IntersectionObserver |
| `Palette.md`         | ⌘K · Pagefind · **only client island** |

## Primitives you inherit (don't rewrite)

- **DarkModeToggle** — a `Button` in ghost variant with `aria-pressed` + icon swap
- **Kbd** — `<kbd>` styled span, mono, 11px, border — for keyboard hints
- **Skip link** — see `06-a11y.md § Keyboard`

## Global rules for every component

1. **One ref artifact.** Match what's in `blog/Blog A.html` and `design-system/Design System.html`. When the code and the reference disagree, the reference wins for visuals, the doc wins for API.
2. **No client JS** unless the component doc says so. Palette is the only exception.
3. **All tokens via `vars.*`.** No raw hex, no raw durations, no raw numbers for spacing.
4. **Focus-visible on every interactive element.** Never bare `:focus`.
5. **Works in dark mode without special cases.** If you need `@media (prefers-color-scheme: dark)` inside a component, you're reaching past the semantic layer — add a token instead.
6. **Typed props.** `strict: true`. No `any`. No implicit any. No `as Foo`.
7. **One component = one file = one responsibility.** Split before it grows past ~150 LOC.
