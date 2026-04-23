# NavRail

Sticky sidebar — 220px wide, desktop only.

## Anatomy

```
┌──────────────────────────┐
│ ▣ vallista-land          │  ← brand mark (22px square)
│   prose & systems         │
├──────────────────────────┤
│ NAVIGATION                │  ← group title (mono, small caps)
│ Home                      │
│ Articles          42      │  ← active: bg-soft + ink + 600
│ Notes             28      │
│ Projects          6       │
│ Tags                      │
│ About                     │
├──────────────────────────┤
│ SERIES                    │
│ DX 재정비                  │
│ TypeScript 실전            │
├──────────────────────────┤
│ ☀/🌙 Theme · RSS · Feed   │  ← footer
└──────────────────────────┘
```

## Component

```astro
---
// src/components/blog/NavRail.astro
const { path } = Astro.props;
const current = (p: string) => (path === p || path.startsWith(p + "/")) ? "page" : undefined;
---
<aside class="rail">
  <a href="/" class="brand">
    <span class="mark"></span>
    <span>
      <span class="name">vallista-land</span>
      <span class="role">prose &amp; systems</span>
    </span>
  </a>

  <nav aria-label="주 메뉴">
    <div class="group-title">Navigation</div>
    <a href="/"          aria-current={current("/")}>Home</a>
    <a href="/articles"  aria-current={current("/articles")}>Articles <span class="count">42</span></a>
    <a href="/notes"     aria-current={current("/notes")}>Notes <span class="count">28</span></a>
    <a href="/projects"  aria-current={current("/projects")}>Projects <span class="count">6</span></a>
    <a href="/tags"      aria-current={current("/tags")}>Tags</a>
    <a href="/about"     aria-current={current("/about")}>About</a>
  </nav>

  <footer class="rail-footer">
    <DarkModeToggle />
    <a href="/rss.xml">RSS</a>
    <a href="/feed">Feed</a>
  </footer>
</aside>
```

## Rules

- Active state driven by `aria-current="page"` — **not** a CSS class. One source of truth.
- Count badges: `vars.font.mono` / 11px / `vars.color.ink4`.
- Brand mark is 22×22 `vars.color.ink` with a 12×12 `vars.color.accent` inner square.
- Fixed / sticky behavior: `position: sticky; top: 0; align-self: start; height: 100vh; overflow-y: auto`.
- Below 960px the rail collapses into a top bar + hamburger → `MobileMenu`.

## CSS

```css
.rail { width: 220px; padding: 28px 20px; border-right: 1px solid vars.color.line2; }
.rail nav a {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 10px;
  border-radius: vars.radius[2];
  color: vars.color.ink3;
  font: 500 13.5px/1.4 vars.font.sans;
  transition: background vars.duration.fast vars.easing.out,
              color vars.duration.fast vars.easing.out;
}
.rail nav a:hover { background: vars.color.bgSoft; color: vars.color.ink2; }
.rail nav a[aria-current="page"] { background: vars.color.bgSoft; color: vars.color.ink; font-weight: 600; }
```
