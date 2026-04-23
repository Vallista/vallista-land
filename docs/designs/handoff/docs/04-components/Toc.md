# Toc (Table of Contents)

Floating right rail, active heading tracking.

## Behavior

- Collects every `<h2>` and `<h3>` inside `<article>` — their `id` drives the anchor.
- Active section tracked via `IntersectionObserver`.
- Hidden below 1100px viewport.
- `position: fixed; top: 100px; right: 40px`.

## Markup

```astro
---
// src/components/blog/Toc.astro
type Heading = { depth: 2 | 3; slug: string; text: string };
const { headings } = Astro.props as { headings: Heading[] };
---
<nav class="toc" aria-label="이 글에서" hidden={headings.length < 2}>
  <div class="head">On this page</div>
  <ol>
    {headings.map(h => (
      <li class={`depth-${h.depth}`}>
        <a href={`#${h.slug}`} data-toc-link>{h.text}</a>
      </li>
    ))}
  </ol>
</nav>
```

## Active tracking

```ts
const links = document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]");
const byId = new Map([...links].map(a => [a.hash.slice(1), a]));

const io = new IntersectionObserver((entries) => {
  const top = entries
    .filter(e => e.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
  if (!top) return;
  links.forEach(l => l.classList.remove("active"));
  byId.get(top.target.id)?.classList.add("active");
}, { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.5, 1] });

document.querySelectorAll<HTMLElement>("article h2[id], article h3[id]").forEach(h => io.observe(h));
```

## CSS

```css
.toc {
  position: fixed; top: 100px; right: 40px;
  width: 220px;
  padding: 0 0 0 14px;
  border-left: 1px solid vars.color.line2;
  z-index: vars.zIndex.tocRail;
}
.toc .head {
  font: 600 11px vars.font.mono;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: vars.color.ink4;
  margin-bottom: 12px;
}
.toc a {
  display: block;
  padding: 6px 0 6px 14px;
  margin-left: -14px;
  color: vars.color.ink4;
  font: 400 12.5px/1.4 vars.font.sans;
  border-left: 2px solid transparent;
}
.toc li.depth-3 a { padding-left: 28px; font-size: 12px; }
.toc a.active {
  color: vars.color.accent;
  font-weight: 600;
  border-left-color: vars.color.accent;
}

@media (max-width: 1099px) { .toc { display: none; } }
```

## Rules

- Hide when `headings.length < 2` — a single h2 doesn't need a TOC.
- Do not duplicate headings in multiple depths (server-side guard).
- Smooth-scroll on click only if `prefers-reduced-motion` is not reduce.
