# Card

Post card, project card. Both share the same base; content varies.

## Post card

```html
<a class="card post-card" href="/articles/slug">
  <Cover kind="grid" ratio="16/9" />
  <div class="meta">
    <time>2024.11.02</time>
    <span>9 min</span>
  </div>
  <h3>왜 vanilla-extract으로 옮겼는가</h3>
  <div class="chips">
    <Chip>CSS</Chip>
    <Chip tone="blue">DX 재정비</Chip>
  </div>
</a>
```

- Cover: 16/9 `<Cover>` at top
- Meta row: date (mono) + reading time (mono)
- H3 title — `h3` token, 600
- Chip row at bottom

## Project card

```html
<a class="card project-card" href="https://github.com/...">
  <Cover kind="blocks" ratio="16/7" />
  <div class="tag">CLI · 2024</div>
  <h3>cross-gitignore</h3>
  <p>모노레포 전역 gitignore를 …</p>
  <div class="footer">
    <Chip dot tone="green">active</Chip>
    <span class="stars">★ 128</span>
  </div>
</a>
```

## CSS

```css
.card {
  display: flex; flex-direction: column; gap: 14px;
  padding: 20px;
  background: vars.color.bg;
  border: 1px solid vars.color.line2;
  border-radius: vars.radius[5];
  text-decoration: none; color: inherit;
  box-shadow: vars.elevation[1];
  transition: border-color vars.duration.fast vars.easing.out,
              box-shadow vars.duration.base vars.easing.out,
              transform vars.duration.base vars.easing.out;
}
.card:hover {
  border-color: vars.color.line;
  box-shadow: vars.elevation[2];
  transform: translateY(-1px);
}
.card:focus-visible { outline: none; box-shadow: vars.focusRing, vars.elevation[2]; }
```

## Rules

- Never nest a `<button>` inside a `<a class="card">` card. Whole card is the link.
- If the card needs secondary actions (bookmark, share), use a footer button bar — the parent stays a link, the buttons use `event.stopPropagation()`.
- Hover lift is 1px. Not more.
