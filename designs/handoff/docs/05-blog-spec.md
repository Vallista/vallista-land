# Blog Spec

This is the implementation spec for the blog itself. All design decisions
already live in `blog/Blog A.html`; this file translates them into routes,
data model, and behaviors Claude Code can implement directly.

## Routes

```
/                   → Home
/articles           → Articles list (paginated, 12/page)
/articles/[slug]    → Article
/series/[slug]      → Series index (posts in order)
/notes              → Notes timeline
/projects           → Projects grid
/tags               → All tags
/tags/[tag]         → Tag detail
/about              → About
/search             → (palette only — overlays any page)
/rss.xml            → RSS feed
/sitemap.xml        → Sitemap (Astro built-in)
/404                → Not found
```

Target framework: **Astro 4+**. Content collections for articles & notes.

## Content model

### Article
```ts
{
  slug: string,          // "why-vanilla-extract"
  title: string,         // "왜 vanilla-extract으로 옮겼는가"
  dek: string,           // one-line summary (displayed as lede)
  date: Date,            // pub date
  updated?: Date,        // optional; show "updated on …" when present
  tag: string,           // single primary tag — drives the card chip
  tags: string[],        // all tags (primary + secondary) — drives /tags/*
  series?: { slug: string, order: number, total: number },
  cover: "grid" | "stripes" | "dots" | "blocks" | "lines",
  minutes: number,       // pre-computed reading time
  words: number,         // pre-computed
  featured?: boolean,    // exactly ONE featured post on Home
  draft?: boolean,
}
```

### Note (short-form)
```ts
{
  slug: string,
  date: Date,
  text: string,         // ≤ 280 chars, single paragraph, no headings
  tags?: string[],
}
```

### Project
```ts
{
  slug: string,
  title: string,
  tag: string,          // "CLI · 2024"
  description: string,
  status: "active" | "maintenance" | "archived",
  stars: number,        // fetched at build time from GitHub
  cover: keyof Covers,
  links: { github?: string, demo?: string, docs?: string },
}
```

## Home layout

Matches `PaperHome` in the reference exactly.

1. **Eyebrow + H1** ("@vallista · 글" + "최근에 쓴 글") left, Search bar right.
2. **Featured post** (whichever article has `featured: true`), 2-column
   layout: cover left, meta/title/dek right. Chips: `Featured` (blue) + `Article · N min`.
3. **List** 2-column grid, next 4 articles by date desc. Thumbnail + meta +
   title + tag chips. If the list has < 4 items, collapse to 1 column and
   don't show empty cells.
4. Pagination: "Articles →" link to `/articles` at the bottom; no numeric pages on Home.

## Article layout

1. 2px reading progress bar at top of `<main>`, driven by scroll.
2. Chips row: primary tag (+ series chip blue with "1 / 4" format).
3. H1 + dek + byline meta row (date · read time · word count).
4. Prose. Headings (h2) get auto-generated `id`s (slugified Korean via
   `@stefanprobst/rehype-extract-toc` or equivalent).
5. Optional floating TOC (right, sticky) — desktop only ≥ 1100px.
6. Footnotes block if the article has any.
7. "Next in series" card if `series` is set.

Reading column: `max-width: 720px`, `padding: 72px 40px 120px`, centered.

## Notes page

Timeline list, newest first. Left-border as a rail; first item gets a blue
dot, the rest get `--line` dots.

Fixed date column (52px wide mono), right: note text at 15.5px / 1.7.

## Projects page

2-column grid, stars fetched at build time (cache 24h). Status chip
color-coded: active = green, maintenance = neutral, archived = warm/amber.

GitHub link lives at bottom-right of each card; entire card is clickable to
the project's detail/landing (typically a README on GitHub if no demo).

## Tag detail

Breadcrumb: `@vallista / tags / [tag]`. Large `#tag` title in accent color.
Count badge in mono. Related-tags row below (all other tags that co-occur
with this one on ≥ 2 posts). Below: date · title · read-time list.

Empty state: "아직 이 태그로 쓴 글이 없습니다. 다른 태그를 둘러보세요." + all-tags link.

## About

Single-column, 680px max. Hero H1 with line break + accent emphasis on second line.
Avatar + bio row. Prose. Two-column "지금 쓰는 것" / "최근 이력" lists. Newsletter
card at bottom — form posts to `/api/subscribe` or opens a mailto if no provider.

## Search palette

Global — bound to `⌘K` / `Ctrl K`. Works on any page. Overlays content at
`z-index: var(--z-modal)`. Built on **Pagefind**:

```sh
# after astro build
npx pagefind --site dist
```

Then client-side:

```js
import { Pagefind } from "/pagefind/pagefind.js";
const pf = await Pagefind();
const { results } = await pf.search(query);
```

Render groups: Articles first (up to 5), Notes, then Tags. Highlight the
query term in result titles with `<mark>` (accent color, no background).

Keyboard: ↑↓ to move, ↵ to open, Esc to close. Wrap-around at ends.

## 404

Short, don't overthink it. Eyebrow "404 · not found", H1 "여기엔 아무것도 없어요.",
one paragraph, "← Home" + "🔎 검색해보기" buttons. Fun but not cute.

## Dark mode

Auto via `prefers-color-scheme: dark` **and** an explicit toggle stored in
localStorage (`theme = "light" | "dark" | "system"`). Toggle in the sidebar
footer. See `tokens.md § Dark` for variable overrides and `blog/Blog A.html` →
`PaperDark` for the reference render.

## Performance targets

| Metric                    | Target     |
|---------------------------|------------|
| Lighthouse Performance    | ≥ 95       |
| LCP                       | ≤ 1.2s     |
| CLS                       | ≤ 0.02     |
| JS shipped on /articles/* | ≤ 20KB gz  |

- Astro island for the search palette only (no other JS on article routes).
- Inline critical CSS; defer Pretendard CDN stylesheet with `media="print"` swap.
- Covers are inline SVG (no network round-trip).

## Accessibility

- WCAG 2.1 AA.
- Every interactive element has a visible `:focus-visible` state.
- Heading hierarchy strict (no skipping levels).
- Images (should we add real ones later): required alt text, Astro `<Image>`.
- Skip link: "본문으로 바로 가기" → first focusable element in `<main>`.

## What Claude Code should produce

```
apps/blog/
  astro.config.mjs
  src/
    layouts/
      BaseLayout.astro       # sidebar + main, dark mode toggle
      ArticleLayout.astro    # reading progress, TOC, footnotes
    components/
      Button.astro           # matches components.md § Button
      Chip.astro
      Input.astro
      Card.astro
      Cover.astro            # 5 SVG patterns
      Callout.astro
      CodeBlock.astro        # Shiki + Copy button
      NavRail.astro
      Toc.astro              # IntersectionObserver
      Palette.tsx            # Pagefind, only client island
    content/
      articles/              # MDX
      notes/                 # MD
      projects/              # YAML
      config.ts              # collection schemas matching Content model above
    pages/
      index.astro
      articles/[...slug].astro
      series/[slug].astro
      notes.astro
      projects.astro
      tags/index.astro
      tags/[tag].astro
      about.astro
      rss.xml.ts
  public/
    pagefind/                # generated post-build
  styles/
    tokens.css               # paste from tokens.md § 1-7
    global.css               # reset + typography.md rules
```
