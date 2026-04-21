# Stack & Project Structure

## Decisions (non-negotiable unless you open an issue)

| Concern         | Choice                                            | Why                                            |
|-----------------|---------------------------------------------------|------------------------------------------------|
| Framework       | **Astro 4+**                                      | Zero-JS by default · content collections · MDX |
| Styling         | **vanilla-extract**                               | Type-safe tokens · zero runtime · scoped       |
| Language        | **TypeScript (strict)**                           | `"strict": true`, `noUncheckedIndexedAccess`   |
| Content         | **Content Collections** (MDX for articles, MD for notes) | Schema validation at build      |
| Search          | **Pagefind**                                      | Static · no backend · works offline            |
| Code highlight  | **Astro's Shiki** (build-time)                    | Zero runtime JS for syntax                     |
| Fonts           | Pretendard (jsDelivr CDN) + JetBrains Mono (Google Fonts) | Pretendard needs variable-font CDN      |
| Package manager | **pnpm**                                          | Deterministic, workspace-ready                 |
| Node            | **≥ 20.10**                                       | Native `--test`, stable fetch                  |
| Test runner     | **Vitest** (unit) + **Playwright** (e2e, smoke only) | Fast, same config as Vite                   |
| Linter          | **Biome**                                         | One binary, format + lint in one pass          |
| CI              | GitHub Actions — build · lint · test · Lighthouse-CI preview | see `.github/workflows/`            |

## Folder layout

```
apps/blog/
  astro.config.mjs
  biome.json
  tsconfig.json
  package.json
  src/
    styles/
      theme.css.ts           # vanilla-extract tokens (paste from docs/theme.css.ts)
      global.css.ts          # reset + body defaults + prose
      sprinkles.css.ts       # atomic utility props (optional, OK to skip v1)
    layouts/
      BaseLayout.astro       # <html><body> + sidebar + <slot/>
      ArticleLayout.astro    # extends BaseLayout — adds reading progress + TOC + footnotes
    components/
      ui/                    # primitives — match 04-components/*.md
        Button.astro
        Chip.astro
        Input.astro
        Kbd.astro
      blog/                  # blog-specific
        Card.astro
        Cover.astro
        Callout.astro
        CodeBlock.astro
        NavRail.astro
        Toc.astro
        ReadingProgress.astro
        DarkModeToggle.astro
      search/
        Palette.tsx          # ONE client island (client:idle) — Pagefind
    content/
      config.ts              # collection schemas
      articles/              # *.mdx
      notes/                 # *.md
      projects/              # *.yaml
    pages/
      index.astro
      articles/index.astro
      articles/[...slug].astro
      series/[slug].astro
      notes.astro
      projects.astro
      tags/index.astro
      tags/[tag].astro
      about.astro
      feed.astro
      rss.xml.ts
      404.astro
      api/
        subscribe.ts         # POST to Buttondown
    lib/
      reading-time.ts        # words → minutes
      slugify-ko.ts          # Korean-aware heading slugs
      github-stars.ts        # build-time cache, 24h TTL
  public/
    pagefind/                # generated post-build
    fonts/                   # (if we self-host Pretendard later)
  tests/
    smoke.spec.ts            # Playwright — one happy path per route
```

## Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check && biome check . && tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lighthouse": "lhci autorun"
  }
}
```

## vanilla-extract setup

`astro.config.mjs`:
```ts
import { defineConfig } from "astro/config";
import vanillaExtract from "@vanilla-extract/vite-plugin";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://vallista.land",
  integrations: [mdx()],
  vite: { plugins: [vanillaExtract()] },
});
```

## MDX rehype/remark pipeline

```ts
// astro.config.mjs — markdown section
markdown: {
  shikiConfig: { theme: "github-light", wrap: true },
  rehypePlugins: [
    ["rehype-slug", { /* custom: use slugify-ko */ }],
    ["rehype-autolink-headings", { behavior: "append" }],
    "rehype-extract-toc",
  ],
  remarkPlugins: ["remark-gfm", "remark-reading-time"],
}
```

## Hard constraints

- **No client JS by default.** Every `<Component client:*>` needs a written reason in a comment.
- **No CSS-in-JS at runtime.** vanilla-extract compiles to static CSS.
- **No icon libraries.** Inline SVG only, copied from the design system reference.
- **No UI libraries.** Build the primitives. They're small.
- **No image optimization pipeline yet.** We ship SVG patterns for covers.
