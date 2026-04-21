# vallista-land · Claude Code Handoff

> **For Claude Code:** Read this file first. It tells you the order to read the rest,
> what to build, and what "done" means. Don't skim — the rules in this folder are
> load-bearing.

Target stack: **Astro 4 + vanilla-extract + TypeScript**. Pretendard (UI), JetBrains Mono (code/meta).
One accent color (blue). Paper Light aesthetic — hairlines over shadows, single accent, calm motion.

---

## Reading order

Read all eight in sequence before writing code.

| # | File                       | What's in it                                 |
|---|----------------------------|----------------------------------------------|
| 0 | `00-README.md`             | (you are here) project goals + reading order |
| 1 | `01-stack.md`              | Framework, folder layout, build pipeline     |
| 2 | `02-tokens.md` + `tokens.json` + `theme.css.ts` | Colors, spacing, radii, elevation, motion — the one source of truth |
| 3 | `03-typography.md`         | Pretendard scale, Korean rules               |
| 4 | `04-components/*.md`       | One file per component · props · a11y        |
| 5 | `05-blog-spec.md`          | Routes, content model, per-page behavior     |
| 6 | `06-a11y.md`               | WCAG 2.1 AA checklist                        |
| 7 | `07-motion.md`             | Durations, easings, reduced-motion           |
| 8 | `08-definition-of-done.md` | What "finished" means for each deliverable   |

## Reference artifacts (visual ground truth)

- `design-system/Design System.html` — **the design system reference**. 19 sections covering tokens, components, patterns, do/don't. Open this alongside `02-tokens.md`.
- `blog/Blog A.html` — **the approved blog visual target** (A · Paper Light). 9 fully-rendered screens: Home, Article (light+dark), Notes, Projects, Tag, About, Search palette (⌘K), Mobile menu.
- `blog/Blog Variants.html` — original 3 exploration directions for context only. **Do not build from.**

When a spec and a reference artifact disagree, the spec wins. Raise it as an issue.

## Build order (recommended)

1. **Tokens first.** Port `02-tokens.md` → `theme.css.ts` using vanilla-extract's `createGlobalTheme`. See `theme.css.ts` in this folder for a ready-to-paste starting point. Nothing else compiles without these.
2. **Type + global reset.** See `03-typography.md`. Confirm Pretendard loads from jsDelivr and that `word-break: keep-all` + `text-wrap: pretty` are applied at `<body>`.
3. **Primitives** (`04-components/Button.md`, `Chip.md`, `Input.md`). These compose up.
4. **Layout shell** — sidebar + main + optional floating TOC. See `05-blog-spec.md § Routes`.
5. **Pages** in this order: Home → Article → Notes → Projects → Tag → About.
6. **Search palette** (⌘K) last — uses Pagefind, client-side only.

## Non-goals

- No new iconography beyond what's in the reference artifacts (minimal line SVGs).
- No illustration system. Covers are SVG patterns (see `05-blog-spec.md § Covers`).
- No color beyond one accent + ink ramps. Multi-color is explicitly out of scope.

## Resolved decisions

| Question                          | Decision                                  |
|-----------------------------------|-------------------------------------------|
| Dark mode                         | **Auto (prefers-color-scheme) + explicit toggle** stored in `localStorage`. Toggle in sidebar footer. `theme = "light" | "dark" | "system"`. |
| RSS                               | **Dedicated `/feed` page** + `rss.xml` feed file. Sidebar footer links to both. |
| Newsletter (About page)           | **Real provider** — integrate Buttondown (preferred) or ConvertKit via `/api/subscribe`. No mailto fallback. |
| Content location                  | Astro content collections for articles + notes. Projects as YAML. |
| Deploy target                     | Static host (Cloudflare Pages / Vercel) — no server runtime beyond build. |

## What "done" looks like

See `08-definition-of-done.md`. Summary: every route renders, Lighthouse Performance ≥ 95, WCAG 2.1 AA, `prefers-reduced-motion` respected everywhere, dark mode works in both auto and manual mode.
