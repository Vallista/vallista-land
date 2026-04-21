# Definition of Done

A route, component, or feature is **done** when every box below checks.
Screenshots are worth reading — see `blog/Blog A.html` and `design-system/Design System.html` for visual references.

## Tokens

- [ ] `src/styles/theme.css.ts` exports light + dark themes via `createThemeContract`
- [ ] All values trace back to `docs/tokens.json` (same hex, same duration, same spacing)
- [ ] No component uses raw hex. Only `vars.color.*`
- [ ] No component uses a number for spacing/radius. Only `vars.space.N` / `vars.radius.N`
- [ ] `:root` has all semantic variables declared at load time (no FOUC on dark mode)

## Typography

- [ ] Pretendard Variable loads from jsDelivr, `preconnect` in `<head>`
- [ ] JetBrains Mono loads with `display=swap`
- [ ] `<body>` has `word-break: keep-all` + `text-wrap: pretty`
- [ ] `.prose a` uses accent color + 1px underline (not color alone)
- [ ] No `text-align: justify` anywhere
- [ ] No `word-break: break-all` anywhere
- [ ] Article prose uses the `body` token (17 / 1.85)
- [ ] Default UI uses the `bodyUi` token (14 / 1.60)

## Components

Each primitive (`Button`, `Chip`, `Input`, `Card`, `Cover`, `Callout`, `CodeBlock`, `NavRail`, `Toc`, `Palette`) is done when:

- [ ] Matches its `docs/04-components/<Name>.md` visually + API-wise
- [ ] Has default, hover, focus-visible, disabled states (where applicable)
- [ ] Renders identical to the reference artifact (`blog/Blog A.html` + `design-system/Design System.html`)
- [ ] No client JS unless the doc says so (Palette is the only client island)
- [ ] Props typed strictly. No `any`. No `as`.
- [ ] Works in dark mode

## Per-route

### `/` (Home)

- [ ] Eyebrow + H1 + search bar row
- [ ] Exactly one Featured post (query: `data.featured === true`)
- [ ] 4 most recent non-featured posts in 2-col grid
- [ ] "Articles →" link at bottom (no numeric pagination here)

### `/articles/[...slug]`

- [ ] 2px reading progress bar, top of `<main>`, tracks scroll 1:1
- [ ] Chips row (primary tag + optional series chip)
- [ ] Floating TOC, right rail, desktop ≥ 1100px only
- [ ] TOC active state driven by IntersectionObserver
- [ ] Korean heading IDs slugified (`slugify-ko.ts`)
- [ ] Footnotes rendered if present in MDX
- [ ] "Next in series" card at bottom when `series` is set
- [ ] Code blocks syntax-highlighted by Shiki at build time, with Copy button

### `/notes`

- [ ] Timeline rail + dates in mono
- [ ] First note dot is accent; rest are `--line`

### `/projects`

- [ ] Grid of project cards with cover
- [ ] Star count fetched at build time (24h cache)
- [ ] Status chip color-coded (active/maintenance/archived)

### `/tags/[tag]`

- [ ] Breadcrumb
- [ ] Large `#tag` title in accent
- [ ] Related tags row (co-occurrence ≥ 2)
- [ ] Empty state message when 0 posts

### `/about`

- [ ] Display hero with accent break
- [ ] Avatar + bio row
- [ ] "지금 쓰는 것" / "최근 이력" two-column list
- [ ] Newsletter form POSTs to `/api/subscribe` (Buttondown)
- [ ] Form shows loading + success + error states

### Search palette (⌘K)

- [ ] Bound to ⌘K (macOS) and Ctrl+K (Win/Linux), globally
- [ ] Pagefind built as part of `pnpm build`
- [ ] Results grouped: Articles → Notes → Tags
- [ ] Highlight matched term with `<mark>` in accent
- [ ] Arrow keys navigate (wrap), Enter opens, Esc closes
- [ ] Focus returns to trigger on close

### `/feed` and `/rss.xml`

- [ ] `/rss.xml` valid RSS 2.0 (full content, last 20 posts)
- [ ] `/feed` is a human-readable page listing subscription options (RSS, Atom, JSON Feed, newsletter)

### `/404`

- [ ] Eyebrow "404 · not found"
- [ ] "여기엔 아무것도 없어요."
- [ ] "← Home" + "🔎 검색해보기" buttons

## Accessibility

See `docs/06-a11y.md`. Summary:

- [ ] `axe-core` zero violations
- [ ] Keyboard-only walkthrough passes for every route
- [ ] Skip link on every page
- [ ] All focus states visible
- [ ] `prefers-reduced-motion: reduce` honored
- [ ] Dark mode contrast ≥ AA

## Performance (Lighthouse, mobile preset, production build)

- [ ] Performance ≥ 95
- [ ] LCP ≤ 1.2s
- [ ] CLS ≤ 0.02
- [ ] TBT ≤ 100ms
- [ ] JS shipped on `/articles/*` ≤ 20KB gz
- [ ] Pretendard stylesheet deferred (`media="print"` + onload swap)
- [ ] Critical CSS inlined per page

## Browser support

- [ ] Chrome / Edge / Safari / Firefox last 2 versions
- [ ] iOS Safari 16+, Android Chrome last 2
- [ ] Degrades gracefully below that (SVG patterns fall back to solid bg)

## SEO + meta

- [ ] Every page: `<title>`, `<meta name="description">`, canonical URL, OG + Twitter card
- [ ] Sitemap generated (Astro integration)
- [ ] RSS linked from `<head>` via `<link rel="alternate">`

## Tests

- [ ] Vitest: slug + reading-time helpers
- [ ] Playwright smoke: one `expect(page).toHaveTitle(...)` per route
- [ ] CI green on every PR

## Release

- [ ] `main` deploys to production
- [ ] PR previews on Cloudflare Pages / Vercel
- [ ] Lighthouse CI budget enforced (build fails if Performance < 95)

## Out of scope (do NOT build yet)

- Comments / reactions
- View counts or any user tracking
- Multi-language (UI stays Korean; add i18n later)
- Real image pipeline (stays SVG patterns)
- Admin / editor UI (content is authored in MDX + pushed via git)
