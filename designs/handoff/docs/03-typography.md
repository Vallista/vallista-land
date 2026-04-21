# Typography

**Sans:** Pretendard Variable (jsDelivr), loaded as the `--sans` CDN link.
**Mono:** JetBrains Mono 400/500/600 (Google Fonts).

Never use system fonts for Korean UI. The 200-weight range Pretendard gives us
is why the hairline aesthetic works. For logos/wordmarks, leave a system-font
fallback in case Pretendard fails to load.

## Stack

```css
--sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
        system-ui, "Apple SD Gothic Neo", sans-serif;
--mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

## Scale (blog)

| Token              | Size / Line  | Weight | Tracking | Usage                               |
|--------------------|--------------|--------|----------|-------------------------------------|
| `display`          | 48 / 1.10    | 700    | -1.0     | About page hero                     |
| `h1`               | 44 / 1.15    | 700    | -0.8     | Article title                       |
| `h1-archive`       | 32 / 1.20    | 700    | -0.5     | Home, list pages                    |
| `h2`               | 26 / 1.25    | 700    | -0.3     | Article section headings            |
| `h3`               | 19 / 1.30    | 600    | -0.2     | Card titles, list items             |
| `h4`               | 17 / 1.35    | 600    | -0.2     | Inline subtitles                    |
| `lede`             | 18 / 1.55    | 400    |  0       | Article dek / summary               |
| `body`             | 17 / 1.85    | 400    |  0       | Article paragraph                   |
| `body-ui`          | 14 / 1.60    | 400    |  0       | Default UI text                     |
| `small`            | 13 / 1.60    | 400    |  0       | Card descriptions                   |
| `caption`          | 12 / 1.50    | 500    |  0       | Chips, inline labels                |
| `overline-mono`    | 11 / 1.20    | 500    | +0.14    | Eyebrows, section labels (mono)     |
| `kbd-mono`         | 11 / 1.20    | 500    | +0.10    | ⌘K badge, keyboard hints            |
| `code`             | 13 / 1.75    | 400    |  0       | Code blocks (mono)                  |

- "-1.0" = `letter-spacing: -1px`, "+0.14" = `letter-spacing: 0.14em`.
- Weight 700 is reserved for headings. Everything else uses 400/500/600.

## Korean-specific rules

```css
html {
  word-break: keep-all;   /* break at word boundaries, not syllables */
  text-wrap: pretty;      /* where supported — kills orphaned last lines */
}

/* Reading body */
.prose p {
  line-height: 1.85;
  letter-spacing: -0.005em;  /* tiny tightening for Hangul density */
}
```

**Do not** use `word-break: break-all`. **Do not** justify Korean body text —
`text-align: left` always. Ragged right is correct.

## Eyebrow / overline pattern

Every page uses a mono eyebrow before the H1. Keeps the visual rhythm consistent
across Home / Notes / Projects / Tag / About.

```
@vallista · 글
최근에 쓴 글
```

Render as:

```css
.eyebrow {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-4);
  margin-bottom: 8px;
}
```

## Links

In prose, links get a 1px underline + accent color. Never rely on color alone.

```css
.prose a {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  transition: background var(--dur-fast) var(--ease-out);
}
.prose a:hover { background: var(--accent-tint); }
```

UI links (nav, card titles, chips) have no underline — they're styled as
their container suggests.

## Numerals

Use tabular numerals **only** for tables and metric chips ("9 min · 3,201 words").
Body text keeps proportional figures.

```css
.tabular { font-variant-numeric: tabular-nums; }
```
