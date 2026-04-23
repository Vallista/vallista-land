# CodeBlock

Tabbed code block with Shiki (build-time) syntax highlighting + Copy button.

## Anatomy

```
┌─ tabs ─────────────────────────────── Copy ─┐
│ theme.css.ts │ Button.css.ts                 │
├──────────────────────────────────────────────┤
│ // code body, Shiki-highlighted              │
│                                              │
└──────────────────────────────────────────────┘
```

## Astro component

```astro
---
// src/components/blog/CodeBlock.astro
import { Code } from "astro:components";

type Tab = { name: string; lang: string; code: string };
type Props = { tabs: Tab[] };
const { tabs } = Astro.props;
---
<div class="codeblock" data-codeblock>
  <div class="tabs" role="tablist">
    {tabs.map((tab, i) => (
      <button
        class={`tab ${i === 0 ? "active" : ""}`}
        role="tab"
        aria-selected={i === 0}
        data-tab={i}
      >{tab.name}</button>
    ))}
    <button class="copy" data-copy aria-label="코드 복사">Copy</button>
  </div>
  {tabs.map((tab, i) => (
    <div class="body" role="tabpanel" hidden={i !== 0} data-panel={i}>
      <Code code={tab.code} lang={tab.lang} theme="github-light" />
    </div>
  ))}
</div>
```

## Copy button behavior

```ts
const root = document.querySelector("[data-codeblock]");
const copy = root.querySelector("[data-copy]");
copy.addEventListener("click", async () => {
  const panel = root.querySelector("[data-panel]:not([hidden])");
  await navigator.clipboard.writeText(panel.textContent.trim());
  copy.textContent = "Copied";
  setTimeout(() => (copy.textContent = "Copy"), 1500);
});
```

## Themes

- Light body: `#fff` background, Shiki theme `github-light`
- Dark body: `#080d19` background, Shiki theme `github-dark-dimmed`

Astro's Shiki runs at build time — **no client JS for highlighting**.

## CSS

```css
.codeblock { border: 1px solid vars.color.line; border-radius: vars.radius[4]; overflow: hidden; }
.codeblock .tabs { display: flex; background: vars.color.bgSoft; border-bottom: 1px solid vars.color.line2; }
.codeblock .tab {
  padding: 10px 16px;
  font: 500 12px vars.font.mono;
  color: vars.color.ink4;
  background: none; border: none; cursor: pointer;
}
.codeblock .tab.active {
  color: vars.color.ink;
  background: vars.color.bg;
  border-bottom: 2px solid vars.color.accent;
  margin-bottom: -1px;
}
.codeblock .copy { margin-left: auto; padding: 8px 12px; font: 500 11px vars.font.mono; }
.codeblock pre { margin: 0; padding: 16px 18px; font: 400 13px/1.75 vars.font.mono; overflow-x: auto; }
```

## Accessibility

- Tab roles: `tablist` / `tab` / `tabpanel` with `aria-selected` + `hidden`.
- Copy button has `aria-label` — the visible text "Copy" is not enough when state is announced.
- `pre` scrolls horizontally on overflow — never wrap code.
